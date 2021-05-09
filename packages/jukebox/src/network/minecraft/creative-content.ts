import { BinaryStream } from '@jukebox/binarystream'
import { DataPacket } from './internal/data-packet'
import { Protocol } from '../protocol'

export class McpeCreativeContent extends DataPacket {
  public entries: Array<any>

  public constructor() {
    super(Protocol.CREATIVE_CONTENT)
  }

  public encode(stream: BinaryStream): void {
    // TODO: proper encoding
    stream.writeUnsignedVarInt(this.entries.length)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
