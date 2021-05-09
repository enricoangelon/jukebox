import { BinaryStream } from '@jukebox/binarystream'
import assert from 'assert'

export abstract class Packet {
  private readonly id: number
  private encoded = false

  public constructor(id: number) {
    this.id = id
  }

  protected encodeHeader(stream: BinaryStream): void {
    assert(
      this.encoded == false,
      'Cannot encode multiple times the same packet'
    )
    stream.writeByte(this.getId())
  }

  abstract encode(stream: BinaryStream): void

  public internalEncode(stream = new BinaryStream()): Buffer {
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
