import { SubChunkInterface } from './sub-chunk'

export class EmptySubChunk implements SubChunkInterface {
  public isEmpty() {
    return true
  }

  public getBlockId() {
    return 0
  }

  public setBlock() {
    return false
  }

  public setBlockId() {
    return false
  }

  public getBlockData() {
    return 0
  }

  public setBlockData() {
    return false
  }

  public getBlockLight() {
    return 0
  }

  public setBlockLight() {
    return false
  }

  public getBlockSkyLight() {
    return 0
  }

  public setBlockSkyLight() {
    return false
  }

  public getHighestBlockId() {
    return 0
  }

  public getHighestBlockData() {
    return 0
  }

  public getHighestBlock() {
    return 0
  }

  public toBinary() {
    return Buffer.alloc(6145).fill(0x00)
  }
}
