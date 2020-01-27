import { BinaryStream } from '@jukebox/binarystream'

import { EmptySubChunk } from './empty-sub-chunk'
import { SubChunk } from './sub-chunk'
import { ISubChunk } from './i-sub-chunk'

export class Chunk {
  public x: number = 0
  public z: number = 0
  public height: number = 16
  public subChunks: Map<number, ISubChunk>
  public heightMap: number[] = []
  public biomes: number[] = []
  public hasChanged: boolean = false

  constructor(
    x: number,
    z: number,
    subChunks = new Map(),
    entities = new Map(),
    biomes = [],
    heightMap = []
  ) {
    this.x = x
    this.z = z
    this.subChunks = subChunks

    for (let y = 0; y < this.height; y++) {
      if (!this.subChunks.get(y)) {
        this.subChunks.set(y, new EmptySubChunk())
      }
    }

    if (heightMap.length === 256) {
      this.heightMap = heightMap
    } else {
      if (heightMap.length !== 0) {
        // error
      } else {
        this.heightMap = new Array(256).fill(this.height * 16)
      }
    }

    if (biomes.length === 256) {
      this.biomes = biomes
    } else {
      if (biomes.length !== 0) {
        // error
      } else {
        this.biomes = new Array(256).fill(0x00)
      }
    }
  }

  public getSubChunkSendCount() {
    return this.getHighestSubChunkIndex() + 1
  }

  public setHeightMap(x: number, z: number, value: number) {
    this.heightMap[Chunk.getHeightMapIndex(x, z)] = value
  }

  static getHeightMapIndex(x: number, z: number) {
    return (z << 4) | x
  }

  public getHighestSubChunkIndex() {
    let y
    for (y = this.subChunks.size - 1; y >= 0; --y) {
      if (this.subChunks.get(y) instanceof EmptySubChunk) {
        continue
      }
      break
    }
    return y
  }

  public getSubChunk(y: number, genNew: boolean = false) {
    if (genNew && this.subChunks.get(y) instanceof EmptySubChunk) {
      return this.subChunks.set(y, new SubChunk()).get(y)
    }
    return this.subChunks.get(y)
  }

  public setBlockId(x: number, y: number, z: number, blockId: number) {
    if (this.getSubChunk(y >> 4, true)!.setBlockId(x, y & 0x0f, z, blockId)) {
      this.hasChanged = true
    }
  }

  public getHighestBlock(x: number, z: number) {
    let index = this.getHighestSubChunkIndex()
    if (index === -1) {
      return -1
    }

    for (let y = index; y >= 0; --y) {
      let height = this.getSubChunk(y)!.getHighestBlock(x, z) | (y << 4)
      if (height !== -1) {
        return height
      }
    }

    return -1
  }

  public recalculateHeightMap() {
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        this.setHeightMap(x, z, this.getHighestBlock(x, z) + 1)
      }
    }
  }

  public getFilledSubChunks() {
    return this.getHighestSubChunkIndex() + 1
  }

  public toBinary() {
    let stream = new BinaryStream()

    let subChunkCount = this.getFilledSubChunks()

    for (let y = 0; y < subChunkCount; ++y) {
      stream.append(this.subChunks.get(y)!.toBinary())
    }

    for (let i = 0; i < this.biomes.length; i++) {
      stream.putByte(this.biomes[i])
    }
    stream.putByte(0)

    return stream.getBuffer()
  }
}
