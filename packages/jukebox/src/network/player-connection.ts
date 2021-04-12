import * as Queue from 'promise-queue'
import * as assert from 'assert'

import { McpePlayStatus, PlayStatus } from './minecraft/play-status'
import { createHash, randomBytes } from 'crypto'
import { decode, sign, verify } from 'jsonwebtoken'

import { BinaryStream } from '@jukebox/binarystream'
import { ClientCacheStatus } from './minecraft/client-cache-status'
import { ClientToServerHandshake } from './minecraft/client-to-server-handshake'
import { DataPacket } from './minecraft/internal/data-packet'
import { Encryption } from '../encryption'
import { EncryptionContext } from './minecraft/encryption/encryption-context'
import { FrameReliability } from '@jukebox/raknet/lib/protocol/frame-reliability'
import { Jukebox } from '../jukebox'
import { McpeLogin } from './minecraft/login'
import { McpeServerToClientHandshake } from './minecraft/server-to-client-handshake'
import { NetworkSession } from '@jukebox/raknet'
import { Player } from '../player'
import { Protocol } from './protocol'
import { WrapperPacket } from './minecraft/internal/wrapper-packet'

export class PlayerConnection {
  private readonly networkSession: NetworkSession
  private readonly player: Player | null = null

  // More likely connection connected
  private cacheSupported: boolean

  // Just if encryption is enabled
  private encryptionContext: EncryptionContext | null = null
  private encryptionQueue = new Queue()
  private decryptionQueue = new Queue()

  private wrapperDecodingQueue = new Queue()
  private outputPacketsQueue: Set<DataPacket> = new Set()

  public constructor(session: NetworkSession) {
    this.networkSession = session
  }

  public process(timestamp: number): void {
    if (this.outputPacketsQueue.size > 0) {
      const wrapper = new WrapperPacket()
      const packetNames: Array<string> = []
      for (const dataPacket of this.outputPacketsQueue) {
        wrapper.addPacket(dataPacket)
        packetNames.push(dataPacket.constructor.name)
      }

      this.networkSession.sendQueuedPacket(
        wrapper,
        FrameReliability.RELIABLE_ORDERED
      )
      this.outputPacketsQueue.clear()

      // Make a user friendly log :)
      const packetNameList = packetNames.join(', ')
      const rinfo = this.networkSession.getRemoteInfo()
      Jukebox.getLogger().debug(
        `Sent McpeWrapper{${packetNameList}} to ${rinfo.address}:${rinfo.port}`
      )
    }
  }

  private handle(buffer: Buffer): void {
    const id = buffer.readUInt8(0)
    const stream = new BinaryStream(buffer)

    switch (id) {
      case Protocol.LOGIN:
        const login = new McpeLogin()
        login.internalDecode(stream)
        this.handleLogin(login)
        break
      case Protocol.CLIENT_CACHE_STATUS:
        const clientCacheStatus = new ClientCacheStatus()
        clientCacheStatus.internalDecode(stream)
        this.handleClientCacheStatus(clientCacheStatus)
        break
      case Protocol.CLIENT_TO_SERVER_HANDSHAKE:
        const clientToServerHandshake = new ClientToServerHandshake()
        clientToServerHandshake.internalDecode(stream)
        this.handleClientToServerHandshake(clientToServerHandshake)
        break
      default:
        Jukebox.getLogger().debug(
          `Handler for packet with id=0x${id.toString(16)} not implemented!`
        )
    }
  }

  private addWrapperToDecodingQueue(stream: BinaryStream): void {
    const wrapper = new WrapperPacket()
    this.wrapperDecodingQueue
      .add(() => wrapper.internalAsyncDecode(stream))
      .then(buffers => buffers.forEach(this.handle.bind(this)))
      .catch(err => Jukebox.getLogger().error(err))
  }

  public handleDecrypted(buffer: Buffer): void {
    assert(this.encryptionContext != null, 'Failed to initialize encryption')
    const wrapperBuffer = buffer.slice(0, buffer.byteLength - 8)
    const checksum = buffer.slice(buffer.byteLength - 8, buffer.byteLength)
    const computedChecksum = this.encryptionContext.computeDecryptChecksum(
      wrapperBuffer
    )
    const checksumValid = this.encryptionContext.compareChecksum(
      computedChecksum,
      checksum
    )

    assert(checksumValid == true, 'Invalid encrypted packet checksum')

    const stream = new BinaryStream()
    stream.writeByte(0xfe) // Wrapper header
    stream.write(buffer)
    stream.setOffset(0) // Reset offset after writing

    this.addWrapperToDecodingQueue(stream)
  }

  public handleWrapper(stream: BinaryStream): void {
    if (this.isEncryptionEnabled()) {
      assert(this.encryptionContext != null, 'Failed to initialize encryption')
      // Skip the wrapper header and decrypt the "content"
      const buffer = stream.getBuffer().slice(1)
      this.decryptionQueue
        .add(() => this.encryptionContext!.decrypt(buffer))
        .then(decrypted => {
          this.handleDecrypted(decrypted)
        })
        .catch(err => Jukebox.getLogger().error(err))
      return
    }

    this.addWrapperToDecodingQueue(stream)
  }

  private handleLogin(login: McpeLogin): void {
    assert(this.player == null, 'Player already exists, handling login twice')
    const gameProtocol = login.gameProtocol
    if (login.gameProtocol != Protocol.MC_PROTOCOL) {
      Jukebox.getLogger().error(
        `Client has protocol version ${gameProtocol}, server requires ${Protocol.MC_PROTOCOL}`
      )
      if (gameProtocol > Protocol.MC_PROTOCOL) {
        const playStatus = new McpePlayStatus()
        playStatus.status = PlayStatus.FAILED_SERVER_OUTDATED
        this.sendImmediateDataPacket(playStatus)
      } else {
        const playStatus = new McpePlayStatus()
        playStatus.status = PlayStatus.FAILED_CLIENT_OUTDATED
        this.sendImmediateDataPacket(playStatus)
      }
    }

    const certData = JSON.parse(login.chainData)
    assert('chain' in certData, 'Failed to decode McpeLogin certificate data')
    const certChainData = certData.chain
    if (!Array.isArray(certChainData)) {
      this.disconnect()
      Jukebox.getLogger().error('Received an invalid McpeLogin certificate')
      return
    }

    if (Jukebox.getConfig().encryption != false) {
      const encryption = Jukebox.getEncryption()
      assert(
        encryption != null,
        'Encryption failed to initialize, cannot continue encryption'
      )

      // Each element of the chain contains an element identityPublicKey
      // which is the public key used to sign the next element in the chain
      // The final public key is the public key of the client which is used for protocol encryption
      // All keys are Base64-X509-encoded ECC public keys
      const firstHeader = decode(certChainData[0], { complete: true })
      assert(
        firstHeader != null,
        'Missing client public key, cannot continue encryption'
      )

      let clientRawPubKey = firstHeader!.header.x5u
      for (const token of certChainData) {
        const verified = verify(token, Encryption.rawToPem(clientRawPubKey), {
          algorithms: ['ES384'],
        }) as any
        assert(
          'identityPublicKey' in verified,
          'Missing public key in decoded token'
        )
        clientRawPubKey = verified.identityPublicKey
      }

      // Start encryption phase
      const serverToClientHandshake = new McpeServerToClientHandshake()

      const sharedSecret = encryption.generateSharedSecret(clientRawPubKey)

      const salt = randomBytes(16)

      // Derive key as salted SHA-256 hash digest
      const encryptionKey = createHash('sha256')
        .update(salt)
        .update(sharedSecret)
        .digest()
      const encryptionIV = encryptionKey.slice(0, 12)

      serverToClientHandshake.jwtToken = sign(
        {
          salt: salt.toString('base64'),
        },
        encryption.getPrivateKeyPEM(),
        {
          algorithm: 'ES384',
          header: { x5u: encryption.getPublicKeyX509() },
        }
      )

      this.sendImmediateDataPacket(serverToClientHandshake)

      // Used to notify that next batches are encrypted
      this.encryptionContext = new EncryptionContext(
        encryptionKey,
        encryptionIV
      )
      return
    }

    const playStatus = new McpePlayStatus()
    playStatus.status = PlayStatus.LOGIN_SUCCESS
    this.sendImmediateDataPacket(playStatus)
  }

  private handleClientCacheStatus(packet: ClientCacheStatus): void {
    this.cacheSupported = packet.supported
    Jukebox.getLogger().debug(`Client cache support: ${this.cacheSupported}`)
  }

  private handleClientToServerHandshake(
    _packet: ClientToServerHandshake
  ): void {
    const rinfo = this.networkSession.getRemoteInfo()
    Jukebox.getLogger().info(
      `Successfully estabilished an encrypted connection with ${rinfo.address}:${rinfo.port}`
    )

    const playStatus = new McpePlayStatus()
    playStatus.status = PlayStatus.LOGIN_SUCCESS
    this.sendImmediateDataPacket(playStatus)
  }

  public sendQueuedDataPacket<T extends DataPacket>(packet: T): void {
    this.outputPacketsQueue.add(packet)
  }

  private sendInstantEncryptedWrapper(wrapper: WrapperPacket): void {
    assert(this.encryptionContext != null, 'Failed to initialize encryption!')
    // Encode the buffer and skip the header, theorically should
    // return wrapper header + zlib encoded packets content
    // TODO: use the queue
    const zippedBuffer = wrapper.internalEncode().slice(1)
    const checksum = this.encryptionContext.computeEncryptChecksum(zippedBuffer)
    const fullBuffer = Buffer.concat([zippedBuffer, checksum])
    this.encryptionContext.encrypt(fullBuffer).then(encrypted => {
      // Add the wrapper header
      const stream = new BinaryStream()
      stream.writeByte(0xfe)
      stream.write(encrypted)

      this.networkSession.sendInstantBuffer(
        stream.getBuffer(),
        FrameReliability.RELIABLE_ORDERED
      )
    })
  }

  public sendImmediateDataPacket<T extends DataPacket>(packet: T): void {
    const wrapper = new WrapperPacket()
    wrapper.addPacket(packet)

    if (this.isEncryptionEnabled()) {
      this.sendInstantEncryptedWrapper(wrapper)
      return
    }

    this.networkSession.sendInstantPacket(
      wrapper,
      FrameReliability.RELIABLE_ORDERED
    )
  }

  public isEncryptionEnabled(): boolean {
    return this.encryptionContext != null
  }

  public disconnect(): void {
    // TODO
  }
}
