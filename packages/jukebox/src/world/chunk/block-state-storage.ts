import { BinaryStream } from '@jukebox/binarystream'
import { BlockManager } from '../../block/block-manager'

export class BlockStateStorage {
  private static readonly BLOCKS_SIZE = 4096
  private palette = [BlockManager.getRuntimeId(0, 0)]
  // Every block there will refer to the palette index
  // We initialize all the blocks as air for convenience
  private blocks = new Array(BlockStateStorage.BLOCKS_SIZE).fill(0)

  public static getIndex(x: number, y: number, z: number): number {
    return (x << 8) + (z << 4) + y
  }

  public getRuntimeId(x: number, y: number, z: number): number {
    const paletteIndex = this.blocks[
      BlockStateStorage.getIndex(x & 0x0f, y & 0x0f, z & 0x0f)
    ]
    return this.palette[paletteIndex]
  }

  public setRuntimeId(
    x: number,
    y: number,
    z: number,
    runtimeId: number
  ): void {
    // The runtime id index in the palette
    if (!this.palette.includes(runtimeId)) {
      this.palette.push(runtimeId)
    }
    this.blocks[BlockStateStorage.getIndex(x, y, z)] = this.palette.indexOf(
      runtimeId
    )
  }

  public serializeToBuffer(stream: BinaryStream): void {
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
        break
    }

    // 7 bit: storage type, 1 bit (shift to end): network format (always 1)
    stream.writeByte((bitsPerBlock << 1) | 1)
    const blocksPerWord = Math.floor(32 / bitsPerBlock)
    const wordsPerChunk = Math.ceil(4096 / blocksPerWord)

    // Encoding example
    // https://github.com/NiclasOlofsson/MiNET/blob/4acbccb6dedae066547f8486a2ace1c9d6db0084/src/MiNET/MiNET/Worlds/SubChunk.cs#L294
    const words: number[] = new Array(wordsPerChunk)
    let position = 0
    for (let w = 0; w < wordsPerChunk; w++) {
      let word = 0
      for (let block = 0; block < blocksPerWord; block++) {
        const state = this.blocks[position]
        word |= state << (bitsPerBlock * block)

        position++
      }
      words[w] = word
    }

    for (const w of words) {
      stream.writeIntLE(w)
    }

    // Write palette entries as runtime ids
    stream.writeVarInt(this.palette.length)
    for (const val of this.palette) {
      stream.writeVarInt(val)
    }
  }
}
