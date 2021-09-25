export abstract class Stream {
  protected buffer: Buffer
  protected offset: number

  public constructor(buffer: Buffer, offset = 0) {
    this.buffer = buffer
    this.offset = offset
  }

  public setOffset(v: number) {
    this.offset = v
  }

  public getBuffer(): Buffer {
    return this.buffer
  }
}
