import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { WrapperPacket } from '../../network/minecraft/internal/wrapper-packet'
import { McpeLevelChunk } from '../../network/minecraft/level-chunk'
import { ChunkSlice } from './chunk-slice'

export class Chunk {
  private static readonly MAX_SLICES = 16
  private static readonly BIOMES_SIZE = 256

  private readonly biomes = Buffer.alloc(Chunk.BIOMES_SIZE).fill(0)
  private readonly slices: Map<number, ChunkSlice> = new Map()

  private x: number
  private z: number

  public constructor(x: number, z: number) {
    this.x = x
    this.z = z
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

  public async getWrapper(): Promise<WrapperPacket> {
    return new Promise(resolve => {
      let topEmpty = this.getTopEmpty()

      const stream = new WriteStream(Buffer.alloc((topEmpty + 2) * 4096))
      for (let ci = 0; ci < topEmpty; ci++) {
        this.getSlice(ci).streamEncode(stream)
      }

      stream.write(this.biomes)
      stream.writeByte(0) // border blocks size
      stream.writeUnsignedVarInt(0) // extra data

      const levelChunk = new McpeLevelChunk()
      levelChunk.cacheEnabled = false
      levelChunk.chunkX = this.x
      levelChunk.chunkZ = this.z
      levelChunk.subChunkCount = topEmpty
      levelChunk.data = stream.getBuffer()

      const wrapper = new WrapperPacket()
      wrapper.addPacket(levelChunk)
      resolve(wrapper)
    })
  }

  public getTopEmpty(): number {
    let topEmpty = Chunk.MAX_SLICES
    for (let ci = 0; ci <= Chunk.MAX_SLICES; ci++) {
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
