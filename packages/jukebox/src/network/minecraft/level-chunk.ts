import { BinaryStream } from '@jukebox/binarystream'
import { DataPacket } from './internal/data-packet'
import { Protocol } from '../protocol'

export class McpeLevelChunk extends DataPacket {
  public chunkX: number
  public chunkZ: number
  public subChunkCount: number
  public cacheEnabled: boolean
  public blobHashes: Array<bigint>
  public data: Buffer

  public constructor() {
    super(Protocol.LEVEL_CHUNK)
  }

  public encode(stream: BinaryStream): void {
    stream.writeVarInt(this.chunkX)
    stream.writeVarInt(this.chunkZ)
    stream.writeUnsignedVarInt(this.subChunkCount)
    stream.writeBoolean(this.cacheEnabled)
    if (this.cacheEnabled) {
      stream.writeUnsignedVarInt(this.blobHashes.length)
      for (const hash of this.blobHashes) {
        stream.writeLongLE(hash)
      }
    }
    stream.writeUnsignedVarInt(this.data.byteLength)
    stream.write(this.data)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
