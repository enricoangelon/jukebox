export interface SubChunkInterface {
  isEmpty(): boolean
  getBlockId(x: number, y: number, z: number): number
  setBlock(): void
  setBlockId(x: number, y: number, z: number): void
  getBlockData(x: number, y: number, z: number, data: number): number
  setBlockData(): void
  getBlockLight(): number
  getBlockSkyLight(): number
  setBlockSkyLight(): void
  getHighestBlockId(): number
  getHighestBlockData(x: number, z: number): number
  getHighestBlock(): number
  toBinary(): Buffer
}

export class SubChunk implements SubChunkInterface {
  public blockIds: number[] = []
  public blockData: number[] = []
  public blockLight: number[] = []
  public skyLight: number[] = []

  constructor(
    blockIds: number[] = [],
    blockData: number[] = [],
    blockLight: number[] = [],
    skyLight: number[] = []
  ) {
    if (blockIds.length === 0 || blockIds.length !== 4096) {
      this.blockIds = new Array(4096).fill(0x00)
    }

    if (blockData.length === 0 || blockData.length !== 2048) {
      this.blockData = new Array(2048).fill(0x00)
    }

    if (blockLight.length === 0 || blockLight.length !== 2048) {
      this.blockLight = new Array(2048).fill(0x00)
    }

    if (skyLight.length === 0 || skyLight.length !== 2048) {
      this.skyLight = new Array(2048).fill(0xff)
    }
  }

  public isEmpty(): boolean {
    throw new Error('Method not implemented.')
  }

  public getBlockId(x: number, y: number, z: number): number {
    return this.blockIds[SubChunk.getIdIndex(x, y, z)]
  }

  public setBlock(): void {
    throw new Error('Method not implemented.')
  }

  public setBlockId(x: number, y: number, z: number): void {
    this.blockIds.push(SubChunk.getIdIndex(x, y, z))
  }

  public getBlockData(x: number, y: number, z: number, data: number) {
    let i = SubChunk.getDataIndex(x, y, z)
    if ((y & 1) === 0) {
      this.blockData[i] = (this.blockData[i] & 0xf0) | (data & 0x0f)
    } else {
      this.blockData[i] = ((data & 0x0f) << 4) | (this.blockData[i] & 0x0f)
    }
    return 0
  }

  public setBlockData(): void {
    throw new Error('Method not implemented.')
  }

  public getBlockLight(): number {
    throw new Error('Method not implemented.')
  }

  public getBlockSkyLight(): number {
    throw new Error('Method not implemented.')
  }

  public setBlockSkyLight(): void {
    throw new Error('Method not implemented.')
  }

  public getHighestBlockId(): number {
    throw new Error('Method not implemented.')
  }

  public getHighestBlockData(x: number, z: number): number {
    return this.getBlockData(x, 15, z, 0)
  }

  public getHighestBlock(): number {
    for (let y = 15; y >= 0; y--) {
      if (this.getBlockId(0, y, 0) !== 0) {
        return y
      }
    }
    return 0
  }

  public toBinary(): Buffer {
    return Buffer.from([0x00, ...this.blockIds, ...this.blockData])
  }

  static getDataIndex(x: number, y: number, z: number) {
    return (x << 7) + (z << 3) + (y >> 1)
  }

  static getIdIndex(x: number, y: number, z: number) {
    return (x << 8) | (z << 4) | y
  }
}
