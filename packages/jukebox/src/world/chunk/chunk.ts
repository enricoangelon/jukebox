import { BinaryStream } from '@jukebox/binarystream'
import { ChunkSlice } from './chunk-slice'
import { McpeLevelChunk } from '../../network/minecraft/level-chunk'
import { WrapperPacket } from '../../network/minecraft/internal/wrapper-packet'

export class Chunk {
  private static readonly MAX_SLICES = 16
  private static readonly BIOMES_SIZE = 256

  private readonly biomes = Buffer.alloc(Chunk.BIOMES_SIZE)
  private readonly slices: Map<number, ChunkSlice> = new Map()

  private x: number
  private z: number

  public constructor(x: number, z: number) {
    this.x = x
    this.z = z
    this.biomes.fill(0)
  }

  public getX(): number {
    return this.x
  }

  public getZ(): number {
    return this.z
  }

  public getRuntimeId(x: number, y: number, z: number): number {
    return this.getSlice(y >> 4).getRuntimeId(x & 0x0f, y & 0x0f, z & 0x0f)
  }

  public setRuntimeId(x: number, y: number, z: number, id: number): void {
    this.getSlice(y >> 4).setRuntimeId(x & 0x0f, y & 0x0f, z & 0x0f, id)
  }

  public getWrapper(): WrapperPacket {
    let topEmpty = this.getTopEmpty()

    const stream = new BinaryStream()
    for (let ci = 0; ci < topEmpty; ci++) {
      this.getSlice(ci).streamEncode(stream)
    }
    stream.writeUnsignedVarInt(this.biomes.byteLength)
    stream.write(this.biomes)
    stream.writeByte(0)

    const levelChunk = new McpeLevelChunk()
    levelChunk.cacheEnabled = false
    levelChunk.chunkX = this.x
    levelChunk.chunkZ = this.z
    levelChunk.subChunkCount = topEmpty
    levelChunk.data = stream.getBuffer()

    const wrapper = new WrapperPacket()
    wrapper.addPacket(levelChunk)
    return wrapper
  }

  public getTopEmpty(): number {
    let topEmpty = Chunk.MAX_SLICES
    for (let ci = 15; ci >= 0; ci--) {
      if (!this.slices.has(ci)) {
        topEmpty = ci
      } else {
        break
      }
    }
    return topEmpty
  }

  public getSlice(y: number): ChunkSlice {
    if (y >= Chunk.MAX_SLICES) {
      throw new RangeError(
        `Expected y to be up to ${Chunk.MAX_SLICES}, got ${y}`
      )
    }
    if (!this.slices.has(y)) {
      this.slices.set(y, new ChunkSlice())
    }
    return this.slices.get(y)!
  }
}
