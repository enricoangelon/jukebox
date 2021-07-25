import { Chunk } from './chunk/chunk'
import { CoordinateUtils } from './coordinate-utils'
import { WorldGenerator } from './generator/generator'

// Provider is by default leveldb as bedrock edition definition
export class World {
  private name: string
  private generator: WorldGenerator
  public chunks: Map<string, Chunk> = new Map()

  public constructor(name: string, generator: WorldGenerator) {
    this.name = name
    this.generator = generator
  }

  public tick(timestamp: number): void {}

  public async getChunk(cx: number, cz: number, create = true): Promise<Chunk> {
    const hash = CoordinateUtils.chunkHash(cx, cz)
    if (!this.chunks.has(hash)) {
      const chunk = await this.generator.generateChunkAsync(cx, cz)
      this.chunks.set(hash, chunk)
    }
    return this.chunks.get(hash)!
  }

  public getFolderName(): string {
    return this.name
  }
}
