import { BinaryStream } from '@jukebox/binarystream'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeTickSync extends DataPacket {
  public requestTimestamp: bigint
  public responseTimestamp: bigint

  public constructor() {
    super(Protocol.TICK_SYNC)
  }

  public encode(stream: BinaryStream): void {
    stream.writeLongLE(this.requestTimestamp)
    stream.writeLongLE(this.responseTimestamp)
  }

  public decode(stream: BinaryStream): void {
    this.requestTimestamp = stream.readLongLE()
    this.responseTimestamp = stream.readLongLE()
  }
}
