import { BlockManager } from '../block/block-manager'
import { Chunk } from './chunk/chunk'
// import { h64 } from 'xxhashjs'

export class World {
  // private usedBlobs: Map<number, Chunk> = new Map()

  public getChunk(x: number, z: number): Chunk {
    const stoneId = BlockManager.getRuntimeId(2, 0)
    const chunk = new Chunk(x, z)
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        chunk.setRuntimeId(x, 1, z, stoneId)
      }
    }

    return chunk

    // const hash = h64('test', 0).toNumber()
    // this.usedBlobs.set(hash, chunk)
  }

  public getChunkAsync(x: number, z: number): Promise<Chunk> {
    return new Promise(resolve => {
      const chunk = this.getChunk(x, z)
      resolve(chunk)
    })
  }
}
