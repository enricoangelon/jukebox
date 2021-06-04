import { BinaryStream } from '@jukebox/binarystream'
import { BlockManager } from '../../block/block-manager'
import { assert } from 'console'

export class ChunkSlice {
  private static readonly DATA_SIZE = 4096

  private readonly palette: Array<number> = [BlockManager.getRuntimeId(0, 0)]
  private readonly blocks: Array<number> = new Array(ChunkSlice.DATA_SIZE)

  public constructor() {
    this.blocks.fill(0)
  }

  public getRuntimeId(x: number, y: number, z: number): number {
    ChunkSlice.checkBounds(x, y, z)
    const paletteIndex = this.blocks[ChunkSlice.getIndex(x, y, z)]
    return this.palette[paletteIndex]
  }

  public setRuntimeId(x: number, y: number, z: number, id: number): void {
    ChunkSlice.checkBounds(x, y, z)
    if (!this.palette.includes(id)) {
      this.palette.push(id)
    }
    this.blocks[ChunkSlice.getIndex(x, y, z)] = this.palette.indexOf(id)
  }

  public streamEncode(stream: BinaryStream): void {
    stream.writeByte(8) // sub chunk version
    stream.writeByte(1) // storages count

    let bitsPerBlock = Math.ceil(Math.log2(this.palette.length))
    switch (bitsPerBlock) {
      case 0:
        bitsPerBlock = 1
        break
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
        break
      case 7:
      case 8:
        bitsPerBlock = 8
        break
      default:
        bitsPerBlock = 16
    }

    stream.writeByte((bitsPerBlock << 1) | 1)

    const blocksPerWord = Math.floor(32 / bitsPerBlock)
    const wordsPerChunk = Math.ceil(ChunkSlice.DATA_SIZE / blocksPerWord)

    let position = 0
    for (let w = 0; w < wordsPerChunk; w++) {
      let word = 0
      for (let block = 0; block < blocksPerWord; block++) {
        const state = this.blocks[position]
        word |= state << (bitsPerBlock * block)
        position++
      }
      stream.writeIntLE(word)
    }

    stream.writeVarInt(this.palette.length)
    for (const runtimeId of this.palette) {
      stream.writeVarInt(runtimeId)
    }
  }

  private static checkBounds(x: number, y: number, z: number): void {
    assert(x >= 0 && x < 16, `x (${x}) is not between 0 and 15`)
    assert(y >= 0 && y < 16, `y (${y}) is not between 0 and 15`)
    assert(z >= 0 && z < 16, `z (${z}) is not between 0 and 15`)
  }

  private static getIndex(x: number, y: number, z: number): number {
    return (x << 8) | (z << 4) | y
  }
}
