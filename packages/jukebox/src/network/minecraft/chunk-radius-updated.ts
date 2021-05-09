import { BinaryStream } from '@jukebox/binarystream'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeChunkRadiusUpdated extends DataPacket {
  public radius: number

  public constructor() {
    super(Protocol.CHUNK_RADIUS_UPDATED)
  }

  public encode(stream: BinaryStream): void {
    stream.writeVarInt(this.radius)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
