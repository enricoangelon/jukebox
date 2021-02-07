import { DevLogger, Logger } from '@jukebox/logger'
import { RemoteInfo, Socket, createSocket } from 'dgram'

import { BinaryStream } from '@jukebox/binarystream'
import { EventEmitter } from 'events'
import { Identifiers } from './identifiers'
import { NetworkSession } from './session'
import { Packet } from './packet'
import { randomBytes } from 'crypto'

export class Server extends EventEmitter {
  private static socket: Socket
  private maxConnections: number
  private guidConnections: Map<bigint, NetworkSession>
  private connections: Map<string, NetworkSession>
  private guid: bigint
  private logger: Logger

  public constructor(port: number, maxConnections: number, logger?: Logger) {
    super()
    this.connections = new Map()
    this.guidConnections = new Map()
    this.maxConnections = maxConnections
    this.logger = logger ?? new DevLogger()

    this.guid = randomBytes(8).readBigInt64BE()

    Server.socket = createSocket('udp4').on('error', err => {
      throw err
    })

    Server.socket.bind(port, () => {
      this.emit('listening')
    })

    Server.socket.on('message', async (msg, rinfo) => {
      const stream = new Packet(msg)

      // this.logger.debug('IN > ', stream.getBuffer())

      if (!(await this.handleUnconnected(stream, rinfo))) {
        const session = this.retriveSession(stream, rinfo)
        if (session != null) {
          await session.handle(stream, rinfo)
        } else {
          return
        }
      }
    })
  }

  private async handleUnconnected(
    stream: BinaryStream,
    rinfo: RemoteInfo
  ): Promise<boolean> {
    const packetId = stream.getBuffer()[0]

    if (packetId == Identifiers.UNCONNECTED_PING) {
      await this.handleUnconnectedPing(stream, rinfo)
      return true
    } else if (packetId == Identifiers.UNCONNECTED_PING_OPEN_CONNECTION) {
      if (this.guidConnections.size < this.maxConnections) {
        await this.handleUnconnectedPing(stream, rinfo)
      }
      return true
    }

    return false
  }

  private async handleUnconnectedPing(
    stream: BinaryStream,
    rinfo: RemoteInfo
  ): Promise<void> {
    stream.skip(1)
    const sendTimestamp = stream.readLong()
    const magic = stream.read(16)

    const packet = new Packet()
    packet.writeByte(Identifiers.UNCONNECTED_PONG)
    packet.writeLong(sendTimestamp)
    packet.writeLong(this.guid)
    packet.write(magic)

    // TODO: event, so we can change the motd
    const motd =
      'MCPE;Test motd;422;1.16.201;0;20;' + this.guid + ';Second line;Creative;'
    // this.emit('motd')

    packet.writeUShort(motd.length)
    packet.write(Buffer.from(motd))

    Server.sendBuffer(packet.getBuffer(), rinfo.port, rinfo.address)
  }

  private retriveSession(
    stream: Packet,
    rinfo: RemoteInfo
  ): NetworkSession | null {
    const token = `${rinfo.address}:${rinfo.port}`
    if (!this.connections.has(token)) {
      const packetId = stream.getBuffer()[0]
      if (packetId == Identifiers.OPEN_CONNECTION_REQUEST_1) {
        this.logger.debug(`Creating a session for ${token}`)

        const connection = new NetworkSession(this, rinfo, this.logger)
        this.connections.set(token, connection)
      }
    }

    return this.connections.get(token) ?? null
  }

  public hasClientGuid(guid: bigint | null): boolean {
    return guid != null ? this.guidConnections.has(guid) : false
  }

  public addGuidSession(session: NetworkSession): void {
    this.guidConnections.set(session.getGuid()!, session)
  }

  public close(): void {
    this.getSocket().close()
    // TODO: close each connection
  }

  public getGuid(): bigint {
    return this.guid
  }

  public getSocket(): Socket {
    return Server.socket
  }

  public static sendBuffer(
    buffer: Buffer,
    port: number,
    address: string
  ): void {
    Server.socket.send(buffer, 0, buffer.length, port, address)
  }
}
