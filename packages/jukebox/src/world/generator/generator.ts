import path, { resolve } from 'path'
import { Chunk } from '../chunk/chunk'
import { Worker } from 'worker_threads'
import { CoordinateUtils } from '../coordinate-utils'
import assert from 'assert'

export interface IGenerator {
  new (type: number): WorldGenerator
  generateChunk(cx: number, cz: number): Chunk
}

interface WorkerMessage {
  cx: number
  cz: number
  chunk: Chunk
  hash: string
}

export abstract class WorldGenerator {
  public abstract generateChunk(cx: number, cz: number): Chunk

  public async generateChunkAsync(cx: number, cz: number): Promise<Chunk> {
    return new Promise(resolve => {
      const chunk = this.generateChunk(cx, cz)
      resolve(chunk)
    })
  }
}

export enum Generator {
  OLD_LIMITED,
  INFINITE,
  FLAT,
  END,
}
