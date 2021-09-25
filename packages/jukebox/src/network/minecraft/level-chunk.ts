import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

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

  public encode(stream: WriteStream): void {
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

  public decode(stream: BinaryStream): void {
    this.chunkX = stream.readVarInt()
    this.chunkZ = stream.readVarInt()
    this.subChunkCount = stream.readUnsignedVarInt()
    this.cacheEnabled = stream.readBoolean()
    // TODO: cache
    this.data = stream.read(stream.readUnsignedVarInt())
  }
}
