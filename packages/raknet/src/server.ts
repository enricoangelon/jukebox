import { DevLogger, Logger } from '@jukebox/logger'
import { RemoteInfo, Socket, createSocket } from 'dgram'

import { BinaryStream } from '@jukebox/binarystream'
import { EventEmitter } from 'events'
import { Identifiers } from './identifiers'
import { NetEvents } from './net-events'
import { NetworkSession } from './session'
import { Packet } from './packet'
import { UnconnectedPing } from './protocol/offline/unconnected-ping'
import { UnconnectedPong } from './protocol/offline/unconnected-pong'
import { assert } from 'console'
import { randomBytes } from 'crypto'

export class RakServer extends EventEmitter {
  private static socket: Socket
  private readonly maxConnections: number
  private readonly guidConnections: Map<bigint, NetworkSession> = new Map()
  private readonly sessions: Map<string, NetworkSession> = new Map()
  private readonly guid: bigint
  private readonly logger: Logger
  private readonly port: number
  private readonly running = true

  public constructor(port: number, maxConnections: number, logger?: Logger) {
    super()
    this.port = port
    this.maxConnections = maxConnections
    this.logger = logger ?? new DevLogger()

    this.guid = randomBytes(8).readBigInt64BE()
  }

  public start(): void {
    RakServer.socket = createSocket('udp4').on('error', err => {
      throw err
    })

    RakServer.socket.bind(this.port, () => {
      this.emit('listening', this.port)
    })

    RakServer.socket.on('message', async (msg, rinfo) => {
      // The first byte identifies the packet
      const stream = new BinaryStream(msg)

      if (!(await this.handleUnconnected(stream, rinfo))) {
        const session = this.retriveSession(stream, rinfo)
        if (session != null) {
          await session.handle(stream, rinfo)
        } else {
          return
        }
      }
    })

    // Sync handle all sessions
    const tick = setInterval(() => {
      if (!this.running) {
        clearInterval(tick)
      }

      for (const session of this.sessions.values()) {
        session.tick(Date.now())
      }
    }, 50)
  }

  private async handleUnconnected(
    stream: BinaryStream,
    rinfo: RemoteInfo
  ): Promise<boolean> {
    const packetId = stream.getBuffer().readUInt8(0)

    if (packetId == Identifiers.UNCONNECTED_PING) {
      await this.handleUnconnectedPing(stream, rinfo)
      return true
    } else if (packetId == Identifiers.UNCONNECTED_PING_OPEN_CONNECTION) {
      if (this.guidConnections.size < this.maxConnections) {
        await this.handleUnconnectedPing(stream, rinfo, true)
      }
      return true
    }
    return false
  }

  private async handleUnconnectedPing(
    stream: BinaryStream,
    rinfo: RemoteInfo,
    openConnections = false
  ): Promise<void> {
    const unconnectedPing = new UnconnectedPing(openConnections)
    unconnectedPing.internalDecode(stream)

    const unconnectedPong = new UnconnectedPong()
    unconnectedPong.timestamp = unconnectedPing.timestamp
    unconnectedPong.serverGUID = this.getGuid()

    // TODO: event, so we can change the motd
    const motd =
      'MCPE;Test motd;428;1.16.210;0;20;' + this.guid + ';Second line;Creative;'
    // this.emit('motd')

    unconnectedPong.data = motd
    RakServer.sendPacket(unconnectedPong, rinfo)
  }

  private retriveSession(
    stream: BinaryStream,
    rinfo: RemoteInfo
  ): NetworkSession | null {
    const token = `${rinfo.address}:${rinfo.port}`
    if (!this.sessions.has(token)) {
      const packetId = stream.getBuffer().readUInt8(0)
      if (packetId == Identifiers.OPEN_CONNECTION_REQUEST_1) {
        this.logger.debug(`Creating a RakNet session for ${token}`)

        const connection = new NetworkSession(this, rinfo, this.logger)
        this.sessions.set(token, connection)
      }
    }

    return this.sessions.get(token) ?? null
  }

  public removeSession(session: NetworkSession): void {
    const rinfo = session.getRemoteInfo()
    const token = `${rinfo.address}:${rinfo.port}`
    if (this.sessions.has(token)) {
      this.sessions.delete(token)
      this.emit(NetEvents.CLOSE_SESSION, rinfo)
      this.logger.debug(`Closed session for ${token}`)
    } else {
      this.logger.error(`Cannot remove an unexisting session ${token}`)
    }
  }

  // public hasClientGuid(guid: bigint | null): boolean {
  //  return guid != null ? this.guidConnections.has(guid) : false
  // }

  // public addGuidSession(session: NetworkSession): void {
  //  this.guidConnections.set(session.getGuid(), session)
  // }

  public close(): void {
    this.getSocket().close()
    // TODO: close each connection
  }

  public getGuid(): bigint {
    return this.guid
  }

  public getSocket(): Socket {
    return RakServer.socket
  }

  public static sendPacket<T extends Packet>(
    packet: T,
    rinfo: RemoteInfo
  ): void {
    assert(packet.isEncoded() == false, 'Cannot send a already encoded packet')
    const buffer = packet.internalEncode()
    RakServer.sendBuffer(buffer, rinfo)
  }

  public static sendBuffer(buffer: Buffer, rinfo: RemoteInfo): void {
    RakServer.socket.send(buffer, 0, buffer.length, rinfo.port, rinfo.address)
  }
}
