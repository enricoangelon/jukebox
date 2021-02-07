import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from './identifiers'
import { Logger } from '@jukebox/logger'
import { Packet } from './packet'
import { RemoteInfo } from 'dgram'
import { Server } from './server'

export class NetworkSession {
  private socket: Server
  private rinfo: RemoteInfo
  private logger: Logger

  private guid: bigint | null
  private mtu: number

  private receiveTimestamp: number

  public constructor(socket: Server, rinfo: RemoteInfo, logger: Logger) {
    this.guid = null
    this.logger = logger
    this.socket = socket
    this.rinfo = rinfo
  }

  public async handle(stream: Packet, rinfo: RemoteInfo): Promise<void> {
    if (!(await this.handleDatagram(stream, rinfo))) {
      // this.handleConnectedDatagram(stream, rinfo)
    }
  }

  private async handleDatagram(
    stream: Packet,
    rinfo: RemoteInfo
  ): Promise<boolean> {
    this.receiveTimestamp = Date.now()

    const packetId = stream.getBuffer()[0]
    if (packetId == Identifiers.OPEN_CONNECTION_REQUEST_1) {
      await this.handleOpenConnectionRequest1(stream, rinfo)
      return true
    } else if (packetId == Identifiers.OPEN_CONNECTION_REQUEST_2) {
      await this.handleOpenConnectionRequest2(stream, rinfo)
      return true
    }

    return false
  }

  // private handleConnectedDatagram(stream: BinaryStream, rinfo: RemoteInfo): Promise<void> {
  //
  // }

  private async handleOpenConnectionRequest1(
    stream: Packet,
    rinfo: RemoteInfo
  ): Promise<void> {
    if (this.socket.hasClientGuid(this.getGuid())) {
      this.sendAlreadyConnected()
      return
    }

    stream.skip(1)
    const magic = stream.read(16)

    const remoteProtocol = stream.readByte()
    if (remoteProtocol != 10) {
      this.sendIncompatibleProtocolVersion()
      return
    }

    const mtu = stream.getRemaining().length + 18
    const packet = new Packet()
    packet.writeByte(Identifiers.OPEN_CONNECTION_REPLY_1)
    packet.write(magic)
    packet.writeLong(this.socket.getGuid())
    packet.writeByte(0)
    packet.writeUShort(mtu)

    this.send(packet.getBuffer())
  }

  private async handleOpenConnectionRequest2(
    stream: Packet,
    rinfo: RemoteInfo
  ): Promise<void> {
    stream.skip(1)
    const magic = stream.read(16)
    stream.readAddress()
    this.mtu = stream.readUShort()
    this.guid = stream.readLong()

    if (this.socket.hasClientGuid(this.getGuid())) {
      this.sendAlreadyConnected()
      return
    }

    this.socket.addGuidSession(this)
  }

  private sendIncompatibleProtocolVersion(): void {
    const packet = new Packet()
    packet.writeByte(Identifiers.INCOMPATIBLE_PROTOCOL_VERSION)
    packet.writeByte(10)
    packet.write(
      Buffer.from(
        '\u0000\u00FF\u00FF\u0000\u00FE\u00FE\u00FE\u00FE\u00FD\u00FD\u00FD\u00FD\u0012\u0034\u0056\u0078',
        'binary'
      )
    )
    packet.writeLong(this.socket.getGuid())

    this.send(packet.getBuffer())
  }

  private sendAlreadyConnected(): void {
    const packet = new Packet()
    packet.writeByte(0x12) // ALREADY_CONNECTED
    packet.write(
      Buffer.from(
        '\u0000\u00FF\u00FF\u0000\u00FE\u00FE\u00FE\u00FE\u00FD\u00FD\u00FD\u00FD\u0012\u0034\u0056\u0078',
        'binary'
      )
    )
    packet.writeLong(this.socket.getGuid())
    this.send(packet.getBuffer())
  }

  private send(buffer: Buffer) {
    Server.sendBuffer(buffer, this.rinfo.port, this.rinfo.address)
  }

  public getRemoteInfo(): RemoteInfo {
    return this.rinfo
  }

  public getGuid(): bigint | null {
    return this.guid
  }
}
