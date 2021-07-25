export class SkinImage {
  private width: number
  private height: number
  private data: Buffer

  public constructor(width: number, height: number, data: Buffer) {
    this.width = width
    this.height = height
    this.data = data
  }

  public getWidth(): number {
    return this.width
  }

  public getHeight(): number {
    return this.height
  }

  public getData(): Buffer {
    return this.data
  }
}
