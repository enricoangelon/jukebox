import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../../identifiers'
import { Packet } from '../../packet'

export class ConnectedPong extends Packet {
  public clientTimestamp: bigint
  public timestamp: bigint

  public constructor() {
    super(Identifiers.CONNECTED_PONG)
  }

  public encode(stream: BinaryStream): void {
    stream.writeLong(this.clientTimestamp)
    stream.writeLong(this.timestamp)
  }

  public decode(stream: BinaryStream): void {
    this.clientTimestamp = stream.readLong()
    this.timestamp = stream.readLong()
  }
}
