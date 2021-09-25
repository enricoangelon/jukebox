import assert from 'assert'

import { WriteStream, BinaryStream } from '@jukebox/binarystream'

export abstract class Packet {
  private readonly id: number
  protected encoded = false

  public constructor(id: number) {
    this.id = id
  }

  protected encodeHeader(stream: WriteStream): void {
    stream.writeByte(this.getId())
  }

  abstract encode(stream: WriteStream): void

  public internalEncode(stream: WriteStream): Buffer {
    this.encodeHeader(stream)
    this.encode(stream)
    this.encoded = true

    return stream.getBuffer()
  }

  protected decodeHeader(stream: BinaryStream): void {
    const id = stream.readByte()
    assert(id == this.getId(), 'Packet identifier mismatch')
  }

  abstract decode(stream: BinaryStream): void

  public internalDecode(stream: BinaryStream): void {
    this.decodeHeader(stream)
    this.decode(stream)
  }

  public getId(): number {
    return this.id
  }

  public isEncoded(): boolean {
    return this.encoded
  }
}
