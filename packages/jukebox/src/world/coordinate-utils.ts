export class CoordinateUtils {
  public static fromBlockToChunk(v: number): number {
    return v >> 4
  }

  public static fromChunkToBlock(v: number): number {
    return v << 4
  }

  public static chunkHash(cx: number, cz: number): string {
    return `${cx}:${cz}`
  }

  public static getXZ(encodedPos: string): number[] {
    return encodedPos.split(':').map(v => parseInt(v))
  }
}
