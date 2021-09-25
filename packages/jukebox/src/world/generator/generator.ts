import { Chunk } from '../chunk/chunk'

export interface IGenerator {
  new (type: number): WorldGenerator
  generateChunk(cx: number, cz: number): Chunk
}

export abstract class WorldGenerator {
  public abstract generateChunk(cx: number, cz: number): Chunk

  public async generateChunkAsync(cx: number, cz: number): Promise<Chunk> {
    return new Promise(resolve => resolve(this.generateChunk(cx, cz)))
  }
}

export enum Generator {
  OLD_LIMITED,
  INFINITE,
  FLAT,
  END,
}
