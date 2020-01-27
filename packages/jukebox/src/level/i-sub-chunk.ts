export interface ISubChunk {
  isEmpty(): boolean
  getBlockId(x: number, y: number, z: number): number
  setBlock(): void
  setBlockId(x: number, y: number, z: number, blockId: number): boolean
  getBlockData(x: number, y: number, z: number, data: number): number
  setBlockData(): void
  getBlockLight(): number
  getBlockSkyLight(): number
  setBlockSkyLight(): void
  getHighestBlockId(): number
  getHighestBlockData(x: number, z: number): number
  getHighestBlock(x: number, y: number): number
  toBinary(): Buffer
}
