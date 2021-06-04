import { McpePlayStatus, PlayStatus } from './minecraft/play-status'
import {
  McpeResourcePackResponse,
  ResourcePackResponse,
} from './minecraft/resource-pack-response'
import { createHash, createPublicKey, randomBytes } from 'crypto'
import { decode, sign, verify } from 'jsonwebtoken'

import { BinaryStream } from '@jukebox/binarystream'
import { ClientCacheStatus } from './minecraft/client-cache-status'
import { ClientToServerHandshake } from './minecraft/client-to-server-handshake'
import { DataPacket } from './minecraft/internal/data-packet'
import { Difficulty } from '../world/difficulty'
import { Dimension } from '../world/dimension'
import { EncryptionContext } from './minecraft/encryption/encryption-context'
import { EntityPlayer } from '../entity/entity-player'
import { FrameReliability } from '@jukebox/raknet/lib/protocol/frame-reliability'
import { Gamemode } from '../world/gamemode'
import { Generator } from '../world/generator'
import { Jukebox } from '../jukebox'
import { McpeBiomeDefinitionList } from './minecraft/biome-definition-list'
import { McpeChunkRadiusUpdated } from './minecraft/chunk-radius-updated'
import { McpeCreativeContent } from './minecraft/creative-content'
import { McpeLogin } from './minecraft/login'
import { McpeRequestChunkRadius } from './minecraft/request-chunk-radius'
import { McpeResourcePackStack } from './minecraft/resource-pack-stack'
import { McpeResourcePacksInfo } from './minecraft/resource-packs-info'
import { McpeServerToClientHandshake } from './minecraft/server-to-client-handshake'
import { McpeSetLocalPlayerAsInitialized } from './minecraft/set-local-player-as-initialized'
import { McpeStartGame } from './minecraft/start-game'
import { McpeTickSync } from './minecraft/tick-sync'
import { NetworkSession } from '@jukebox/raknet'
import PromiseQueue from 'promise-queue'
import { Protocol } from './protocol'
import { Vector3 } from '../math/vector3'
import { WrapperPacket } from './minecraft/internal/wrapper-packet'
import assert from 'assert'

export class PlayerConnection {
  private readonly networkSession: NetworkSession
  private readonly player: EntityPlayer

  // More likely connection related
  private cacheSupported: boolean

  // Whatever the client is initialized inside the server
  // so can receive packets and move / etc...
  private initialized = false

  // Just if encryption is enabled
  private encryptionContext: EncryptionContext | null = null
  private encryptionQueue = new PromiseQueue()
  private decryptionQueue = new PromiseQueue()

  private wrapperDecodingQueue = new PromiseQueue()
  private outputPacketsQueue: Set<DataPacket> = new Set()

  public constructor(session: NetworkSession) {
    this.networkSession = session
    const world = Jukebox.getDefaultWorld()
    this.player = new EntityPlayer(world, this)
  }

  public process(timestamp: number): void {
    this.player.tick(timestamp)

    if (this.outputPacketsQueue.size > 0) {
      const wrapper = new WrapperPacket()
      const packetNames: Array<string> = []
      for (const dataPacket of this.outputPacketsQueue) {
        wrapper.addPacket(dataPacket)
        packetNames.push(dataPacket.constructor.name)
        this.outputPacketsQueue.delete(dataPacket)
      }

      if (this.isEncryptionEnabled()) {
        this.encryptWrapper(wrapper).then(encrypted =>
          this.networkSession.sendQueuedBuffer(encrypted)
        )
      } else {
        this.networkSession.sendQueuedPacket(
          wrapper,
          FrameReliability.RELIABLE_ORDERED
        )
      }

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
      case Protocol.RESOURCE_PACK_RESPONSE:
        const resourcePackResponse = new McpeResourcePackResponse()
        resourcePackResponse.internalDecode(stream)
        this.handleResourcePackResponse(resourcePackResponse)
        break
      case Protocol.REQUEST_CHUNK_RADIUS:
        const requestChunkRadius = new McpeRequestChunkRadius()
        requestChunkRadius.internalDecode(stream)
        this.handleRequestChunkRadius(requestChunkRadius)
        break
      case Protocol.TICK_SYNC:
        const tickSync = new McpeTickSync()
        tickSync.internalDecode(stream)
        this.handleTickSync(tickSync)
        break
      case Protocol.SET_LOCAL_PLAYER_AS_INITIALIZED:
        const setLocalPlayerAsInitialized = new McpeSetLocalPlayerAsInitialized()
        setLocalPlayerAsInitialized.internalDecode(stream)
        this.handleSetLocalPlayerAsInitialized(setLocalPlayerAsInitialized)
        break
      default:
        // TODO: improve this with regex (probably)
        const hexId = id.toString(16)
        Jukebox.getLogger().debug(
          `Handler for packet with id=0x${
            hexId.length > 1 ? hexId : '0' + hexId
          } not implemented!`
        )
    }
  }

  private addWrapperToDecodingQueue(stream: BinaryStream): void {
    const wrapper = new WrapperPacket()
    this.wrapperDecodingQueue
      .add(() => wrapper.internalAsyncDecode(stream))
      .then(buffers => buffers.forEach(this.handle.bind(this)))
      .catch(Jukebox.getLogger().error)
  }

  public handleDecrypted(buffer: Buffer): void {
    assert(this.encryptionContext != null, 'Failed to initialize encryption')
    const wrapperBuffer = buffer.slice(0, buffer.length - 8)
    const checksum = buffer.slice(buffer.length - 8, buffer.length)
    const computedChecksum = this.encryptionContext.computeDecryptChecksum(
      wrapperBuffer
    )
    const checksumValid = this.encryptionContext.compareChecksum(
      computedChecksum,
      checksum
    )

    assert(
      checksumValid == true,
      `Invalid encrypted packet checksum expected ${
        checksum.toJSON().data
      } computed ${computedChecksum.toJSON().data}`
    )

    const stream = new BinaryStream()
    stream.writeByte(0xfe) // Wrapper header
    stream.write(wrapperBuffer)
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
        .then(this.handleDecrypted.bind(this))
        .catch(Jukebox.getLogger().error)
      return
    }

    this.addWrapperToDecodingQueue(stream)
  }

  private handleLogin(login: McpeLogin): void {
    assert(
      this.initialized == false,
      'Player already exists, handling login twice'
    )
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
      return
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

      let clientRawPubKey = firstHeader.header.x5u
      for (const token of certChainData) {
        const publicKey = createPublicKey({
          key: Buffer.from(clientRawPubKey, 'base64'),
          format: 'der',
          type: 'spki',
        })
        const verified = verify(
          token,
          publicKey.export({ format: 'pem', type: 'spki' }),
          {
            algorithms: ['ES384'],
          }
        ) as any
        assert(
          'identityPublicKey' in verified,
          'Missing public key in decoded token'
        )
        clientRawPubKey = verified.identityPublicKey
      }

      // Start encryption phase
      const serverToClientHandshake = new McpeServerToClientHandshake()

      const x509PubKey = Buffer.from(clientRawPubKey, 'base64')
      const clientPubKey = createPublicKey({
        key: x509PubKey,
        format: 'der',
        type: 'spki',
      })

      const sharedSecret = encryption.generateSharedSecret(clientPubKey)
      const salt = randomBytes(16)

      // Derive key as salted SHA-256 hash digest
      const encryptionKey = createHash('sha256')
        .update(salt)
        .update(sharedSecret)
        .digest()

      serverToClientHandshake.jwtToken = sign(
        {
          salt: salt.toString('base64'),
        },
        encryption.getPrivateKeyPEM().toString(),
        {
          algorithm: 'ES384',
          header: { x5u: encryption.getPublicKeyPEM().toString('base64') },
        }
      )

      this.sendImmediateDataPacket(serverToClientHandshake)

      // Used to notify that next batches are encrypted
      this.encryptionContext = new EncryptionContext(encryptionKey)
      return
    }

    this.continueLogin()
  }

  private continueLogin(): void {
    const playStatus = new McpePlayStatus()
    playStatus.status = PlayStatus.LOGIN_SUCCESS
    this.sendImmediateDataPacket(playStatus)

    const resourcePacksInfo = new McpeResourcePacksInfo()
    resourcePacksInfo.behaviorPacks = new Array(0)
    resourcePacksInfo.resourcePacks = new Array(0)
    resourcePacksInfo.mustAccept = false
    resourcePacksInfo.hasScripts = false
    this.sendImmediateDataPacket(resourcePacksInfo)
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

    this.continueLogin()
  }

  private handleResourcePackResponse(packet: McpeResourcePackResponse): void {
    // TODO: proper implementation
    if (packet.status == ResourcePackResponse.HAVE_ALL_PACKS) {
      const resourcePackStack = new McpeResourcePackStack()
      resourcePackStack.forceAccept = false
      resourcePackStack.behaviorPacks = new Array(0)
      resourcePackStack.resourcePacks = new Array(0)
      resourcePackStack.experiments = new Array(0)
      resourcePackStack.alreadyEnabledExperiments = false
      this.sendImmediateDataPacket(resourcePackStack)
    } else if (packet.status == ResourcePackResponse.COMPLETED) {
      this.doInitialSpawn()
    }
  }

  private doInitialSpawn(): void {
    const startGame = new McpeStartGame()
    startGame.entityId = this.player.getRuntimeId()
    startGame.runtimeEntityId = this.player.getRuntimeId()

    startGame.playerGamemode = Gamemode.USE_WORLD
    startGame.playerSpawnVector = this.player.getPosition()

    startGame.pitch = 0
    startGame.yaw = 0

    startGame.seed = 0xdeadbeef
    startGame.biomeType = 0
    startGame.biomeName = ''
    startGame.dimension = Dimension.OVERWORLD
    startGame.generator = Generator.INFINITE
    startGame.gamemode = Gamemode.SPECTATOR
    startGame.difficulty = Difficulty.PEACEFUL
    startGame.spawnVector = new Vector3(0, 6, 0)

    startGame.hasAchievementsDisabled = true
    startGame.dayCycleStopTime = 0

    startGame.eduOffer = 0 // TODO: enum
    startGame.eduFeaturesEnabled = false
    startGame.eduProductId = ''

    startGame.rainLevel = 0
    startGame.lightningLevel = 0

    startGame.hasConfirmedPlatformLockedContent = false

    startGame.isMultiplayer = true
    startGame.lanBroadcast = true
    startGame.xblBroadcastMode = 0
    startGame.platformBroadcastMode = 0

    startGame.commandsEnabled = true
    startGame.texturePacksRequired = false
    startGame.gamerules = new Array(0)
    startGame.experiments = new Array(0)
    startGame.experimentsToggledBefore = false
    startGame.hasBonusChestEnabled = false
    startGame.hasStarterMapEnabled = false
    startGame.permissionLevel = 0
    startGame.chunkTickRange = 4
    startGame.hasLockedBehaviorPack = false
    startGame.hasLockedResourcePack = false
    startGame.isFromLockedWorldTemplate = false
    startGame.onlyMsaGamertags = false
    startGame.isFromWorldTemplate = false
    startGame.isWorldTemplateOptionLocked = false
    startGame.spawnOnlyV1Villagers = false

    startGame.limitedWorldHeight = 0
    startGame.limitedWorldWidth = 0

    startGame.hasNewNether = false
    startGame.forceExperimentalGameplay = false

    startGame.levelId = ''
    startGame.worldName = 'Jukebox Server'
    startGame.premiumWorldTemplateId = ''

    startGame.isTrial = false
    startGame.movementType = 0
    startGame.rewindHistorySize = 0
    startGame.serverAuthoritativeBlockBreaking = false

    startGame.worldTicks = 0n

    startGame.enchantmentSeed = 0

    startGame.customBlocks = new Array(0)
    startGame.itemPalette = new Array(0)

    startGame.multiplayerCorrelationId = ''
    // Soon client-side inventory will be deprecated
    startGame.serverAuthoritativeInventory = true
    this.sendQueuedDataPacket(startGame)

    const creativeContent = new McpeCreativeContent()
    creativeContent.entries = new Array(0)
    this.sendQueuedDataPacket(creativeContent)

    const biomeDefinitionList = new McpeBiomeDefinitionList()
    this.sendQueuedDataPacket(biomeDefinitionList)

    // TODO: send chunks

    const playStatus = new McpePlayStatus()
    playStatus.status = PlayStatus.PLAYER_SPAWN
    this.sendQueuedDataPacket(playStatus)
  }

  private handleRequestChunkRadius(packet: McpeRequestChunkRadius): void {
    this.player.viewRadius = packet.radius
    const chunkRadiusUpdated = new McpeChunkRadiusUpdated()
    chunkRadiusUpdated.radius = packet.radius
    this.sendImmediateDataPacket(chunkRadiusUpdated)
  }

  private handleTickSync(packet: McpeTickSync): void {
    const tickSync = new McpeTickSync()
    tickSync.requestTimestamp = packet.responseTimestamp
    tickSync.responseTimestamp = process.hrtime.bigint()
    this.sendImmediateDataPacket(tickSync)
  }

  private handleSetLocalPlayerAsInitialized(
    packet: McpeSetLocalPlayerAsInitialized
  ): void {
    assert(
      this.getPlayerInstance().getRuntimeId() == packet.runtimeEntityId,
      'Entity runtime id mismatch, some weird behavior happened!'
    )
    this.initialized = true
  }

  public sendQueuedDataPacket<T extends DataPacket>(packet: T): void {
    this.outputPacketsQueue.add(packet)
  }

  private sendImmediateEncryptedWrapper(wrapper: WrapperPacket): void {
    this.encryptWrapper(wrapper)
      .then(encrypted => {
        this.networkSession.sendInstantBuffer(
          encrypted,
          FrameReliability.RELIABLE_ORDERED
        )
      })
      .catch(Jukebox.getLogger().error)
  }

  private async encryptWrapper(wrapper: WrapperPacket): Promise<Buffer> {
    assert(this.encryptionContext != null, 'Failed to initialize encryption!')
    // Encode the buffer and skip the header, theorically should
    // return wrapper header + zlib encoded packets content
    const zippedBuffer = wrapper.internalEncode().slice(1)
    const checksum = this.encryptionContext.computeEncryptChecksum(zippedBuffer)
    const fullBuffer = Buffer.concat([zippedBuffer, checksum])
    return new Promise((resolve, reject) => {
      this.encryptionQueue
        .add(() => this.encryptionContext!.encrypt(fullBuffer))
        .then(encrypted =>
          // Write the wrapper header
          resolve(Buffer.concat([Buffer.from('fe', 'hex'), encrypted]))
        )
        .catch(reject)
    })
  }

  public sendImmediateDataPacket<T extends DataPacket>(packet: T): void {
    const wrapper = new WrapperPacket()
    wrapper.addPacket(packet)
    this.sendImmediateWrapper(wrapper)
  }

  public sendImmediateWrapper(wrapper: WrapperPacket): void {
    if (this.isEncryptionEnabled()) {
      this.sendImmediateEncryptedWrapper(wrapper)
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

  public isInitialized(): boolean {
    return this.initialized
  }

  public getPlayerInstance(): EntityPlayer {
    return this.player
  }

  public disconnect(): void {
    // TODO
  }
}
