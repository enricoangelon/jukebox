import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeCreativeContent extends DataPacket {
  public entries: Array<any>

  public constructor() {
    super(Protocol.CREATIVE_CONTENT)
  }

  public encode(stream: WriteStream): void {
    // TODO: proper encoding
    stream.writeUnsignedVarInt(this.entries.length)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
