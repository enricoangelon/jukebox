import { BinaryStream } from '@jukebox/binarystream'
import { DataPacket } from './internal/data-packet'
import { Protocol } from '../protocol'

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
