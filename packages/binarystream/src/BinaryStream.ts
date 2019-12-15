export class BinaryStream {
  private buffer: Buffer

  constructor(buffer: Buffer | null) {
    if (!buffer) {
      buffer = Buffer.alloc(0)
    }

    this.buffer = buffer
  }

  public getBuffer(): Buffer {
    return this.buffer
  }
}
