import { BinaryStream } from '@jukebox/binarystream'
import { BlockManager } from '../../block/block-manager'
import { McpeLevelChunk } from '../../network/minecraft/level-chunk'
import { SubChunk } from './sub-chunk'

export class Chunk {
  private static readonly MAX_SUBCHUNKS = 16
  private subChunks: Map<number, SubChunk> = new Map()
  private biomes = Buffer.alloc(256).fill(0) // TODO: proper implementation
  private x: number
  private z: number

  public constructor(x: number, z: number) {
    this.x = x
    this.z = z
  }

  public getSubChunksMap(): Map<number, SubChunk> {
    return this.subChunks
  }

  public getSubChunks(): Array<SubChunk> {
    return Array.from(this.subChunks.values())
  }

  public getSubChunk(index: number): SubChunk | null {
    return this.subChunks.get(index) ?? null
  }

  public getRuntimeId(x: number, y: number, z: number, layer: number): number {
    const subChunk = this.getSubChunk(y >> 4)
    if (subChunk == null) {
      // If the sub chunk doesn't exist, is probably air
      return BlockManager.getRuntimeId(0, 0)
    }
    return subChunk.getRuntimeId(x, y, z, layer)
  }

  public setRuntimeId(
    x: number,
    y: number,
    z: number,
    runtimeId: number,
    layer = 0
  ): void {
    const subChunk = this.getSubChunk(y >> 4)
    if (subChunk == null) {
      this.subChunks.set(y >> 4, new SubChunk())
    }
    this.getSubChunk(y >> 4)!.setRuntimeId(x, y, z, runtimeId, layer)
  }

  public getTopEmpty(): number {
    let topEmpty = Chunk.MAX_SUBCHUNKS
    for (let i = 0; i <= Chunk.MAX_SUBCHUNKS; i++) {
      const subChunk = this.getSubChunk(i)
      if (subChunk == null) {
        topEmpty = i
      } else {
        break
      }
    }
    return topEmpty
  }

  public serializeToPacket(): McpeLevelChunk {
    const packet = new McpeLevelChunk()
    const stream = new BinaryStream()

    let topEmpty = 0
    for (let y = 0; y < Chunk.MAX_SUBCHUNKS; y++) {
      if (this.getSubChunk(y) !== null) {
        topEmpty = y + 1
      }
    }

    for (const subChunk of this.subChunks.values()) {
      if (subChunk == undefined) {
        continue
      }
      subChunk.serializeToBuffer(stream)
    }

    for (let y = 0; y < topEmpty; y++) {
      if (this.getSubChunk(y) == null) {
        stream.writeByte(SubChunk.FORMAT_VERSION)
        stream.writeByte(0)
      }
    }

    stream.writeUnsignedVarInt(this.biomes.byteLength)
    stream.write(this.biomes)
    stream.writeByte(0)

    packet.chunkX = this.x
    packet.chunkZ = this.z
    packet.subChunkCount = topEmpty
    packet.cacheEnabled = false
    packet.data = stream.getBuffer()
    return packet
  }

  public getX(): number {
    return this.x
  }

  public getZ(): number {
    return this.z
  }
}
