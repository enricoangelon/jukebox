import { BlockManager } from '../../block/block-manager'
import { Chunk } from '../chunk/chunk'
import { WorldGenerator } from './generator'

export class Flat extends WorldGenerator {
  public generateChunk(cx: number, cz: number): Chunk {
    const chunk = new Chunk(cx, cz)
    const bedrockId = BlockManager.getRuntimeId('minecraft:bedrock')
    const dirtId = BlockManager.getRuntimeId('minecraft:dirt')
    const grassId = BlockManager.getRuntimeId('minecraft:grass')
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        let y = 0
        chunk.setRuntimeId(x, y++, z, bedrockId)
        chunk.setRuntimeId(x, y++, z, dirtId)
        chunk.setRuntimeId(x, y++, z, dirtId)
        chunk.setRuntimeId(x, y, z, grassId)
      }
    }

    return chunk
  }
}
