import { BinaryStream } from '@jukebox/binarystream'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeRequestChunkRadius extends DataPacket {
  public radius: number

  public constructor() {
    super(Protocol.REQUEST_CHUNK_RADIUS)
  }

  public encode(): void {
    throw new Error('Unsupported operation')
  }

  public decode(stream: BinaryStream): void {
    this.radius = stream.readVarInt()
  }
}
