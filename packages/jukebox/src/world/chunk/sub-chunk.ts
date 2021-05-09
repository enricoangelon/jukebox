import { BinaryStream } from '@jukebox/binarystream'
import { BlockManager } from '../../block/block-manager'
import { BlockStateStorage } from './block-state-storage'

// A SubChunk is a grid-aligned 16x16x16 cubes
export class SubChunk {
  // Palettized format with storage list (version 8)
  public static readonly FORMAT_VERSION = 8
  // Supports n block storages [block storage1]...[blockStorageN]
  private storages: Map<number, BlockStateStorage> = new Map()

  public getBlockStateStorage(index: number): BlockStateStorage | null {
    return this.storages.get(index) ?? null
  }

  public isEmpty(): boolean {
    return this.storages.size == 0
  }

  public getRuntimeId(x: number, y: number, z: number, layer: number): number {
    const storage = this.getBlockStateStorage(layer)
    if (storage == null) {
      return BlockManager.getRuntimeId(0, 0)
    }
    return storage.getRuntimeId(x, y, z)
  }

  public setRuntimeId(
    x: number,
    y: number,
    z: number,
    runtimeId: number,
    layer: number
  ): void {
    const storage = this.getBlockStateStorage(layer)
    if (storage == null) {
      this.storages.set(layer, new BlockStateStorage()) // TODO
    }
    this.getBlockStateStorage(layer)!.setRuntimeId(x, y, z, runtimeId)
  }

  public serializeToBuffer(stream: BinaryStream): void {
    stream.writeByte(SubChunk.FORMAT_VERSION)
    stream.writeByte(this.storages.size)
    for (const storage of this.storages.values()) {
      storage.serializeToBuffer(stream)
    }
  }
}
