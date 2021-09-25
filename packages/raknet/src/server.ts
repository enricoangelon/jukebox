import { assert, time } from 'console'
import { randomBytes } from 'crypto'
import { createSocket, RemoteInfo, Socket } from 'dgram'
import { EventEmitter } from 'events'
import { TaskTimer } from 'tasktimer'

import { BinaryStream, WriteStream } from '@jukebox/binarystream'
import { DevLogger, Logger } from '@jukebox/logger'

import { Identifiers } from './identifiers'
import { Info } from './info'
import { NetEvents } from './net-events'
import { Packet } from './packet'
import { UnconnectedPing } from './protocol/offline/unconnected-ping'
import { UnconnectedPong } from './protocol/offline/unconnected-pong'
import { NetworkSession } from './session'

export class RakServer extends EventEmitter {
  private static socket: Socket
  private readonly maxConnections: number
  private readonly guidConnections: Map<bigint, NetworkSession> = new Map()
  private readonly sessions: Map<string, NetworkSession> = new Map()
  private readonly guid: bigint
  private readonly logger: Logger
  private readonly port: number

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

    const timer = new TaskTimer(Info.RAKNET_TICK_TIME)
    timer.add({
      callback: () => {
        for (const session of this.sessions.values()) {
          session.tick()
          // TODO: if session is disconnected
        }
      },
    })

    RakServer.socket.bind(this.port, () => {
      this.emit(NetEvents.LISTENING, this.port)
      timer.start()
    })

    RakServer.socket.on('close', () => timer.stop())

    RakServer.socket.on('message', async (msg, rinfo) => {
      // The first byte identifies the packet
      const stream = new BinaryStream(msg)

      try {
        if (!(await this.handleUnconnected(stream, rinfo))) {
          const session = this.retriveSession(stream, rinfo)
          session != null && (await session.handle(stream))
        }
      } catch (error) {
        this.logger.error(
          `Failed to handle a packet from ${rinfo.address}:${rinfo.port}: ${error}`
        )
      }
    })
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
      'MCPE;Test motd;440;1.17.0;0;20;' + this.guid + ';Second line;Creative;'
    // this.emit('motd')

    unconnectedPong.data = motd

    // Buffer size: HEADER (1) + 8 + 8 + MAGIC (16) + 2 data length prefix + data length
    const writeStream = new WriteStream(Buffer.allocUnsafe(35 + motd.length))
    const encoded = unconnectedPong.internalEncode(writeStream)
    RakServer.sendBuffer(encoded, rinfo)
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

  public close(): void {
    this.getSocket().close()
    // TODO: finish to send last packets before closing listeners
    // TODO: close each session
    this.removeAllListeners()
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
    const writeStream = new WriteStream(Buffer.allocUnsafe(4096))
    const buffer = packet.internalEncode(writeStream)
    RakServer.sendBuffer(buffer, rinfo)
  }

  public static sendBuffer(buffer: Buffer, rinfo: RemoteInfo): void {
    RakServer.socket.send(buffer, 0, buffer.length, rinfo.port, rinfo.address)
  }
}
