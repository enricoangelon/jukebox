import { BlockManager } from '../block/block-manager'
import { Chunk } from './chunk/chunk'

export class World {
  public async generateFlatChunkAsync(cx: number, cz: number): Promise<Chunk> {
    return new Promise(resolve => {
      const chunk = new Chunk(cx, cz)
      const grassRid = BlockManager.getRuntimeId(2, 0)
      for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
          chunk.setRuntimeId(x, 2, z, grassRid)
        }
      }
      resolve(chunk)
    })
  }
}
