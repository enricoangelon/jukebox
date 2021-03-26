import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../../identifiers'
import { NetUtils } from '../../net-utils'
import { Packet } from '../../packet'

export class UnconnectedPong extends Packet {
  // The timestamp from the ping
  public timestamp: bigint
  public serverGUID: bigint
  public magic: Buffer
  // The motd in our Minecraft case
  public data: string

  public constructor() {
    super(Identifiers.UNCONNECTED_PONG)
  }

  public encode(stream: BinaryStream): void {
    stream.writeLong(this.timestamp)
    stream.writeLong(this.serverGUID)
    NetUtils.writeMagic(stream)
    NetUtils.writeString(stream, this.data)
  }

  public decode(stream: BinaryStream): void {
    this.timestamp = stream.readLong()
    this.serverGUID = stream.readLong()
    this.magic = NetUtils.readMagic(stream)
    this.data = NetUtils.readString(stream)
  }
}
