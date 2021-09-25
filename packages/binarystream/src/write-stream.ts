import { Stream } from './stream'

export class WriteStream extends Stream {
  public write(buffer: Buffer): void {
    buffer.copy(
      this.buffer,
      this.increaseOffset(buffer.byteLength),
      0,
      this.offset + buffer.byteLength
    )
  }

  public writeByteArray(arr: Uint8Array): void {
    for (const b of arr) {
      this.writeByte(b)
    }
  }

  public writeByte(v: number): void {
    // this.buffer.writeUInt8(v, this.offset++)
    this.buffer[this.offset++] = v & 0xff
  }

  public writeBoolean(v: boolean): void {
    this.writeByte(+v)
  }

  public writeInt(v: number): void {
    this.buffer.writeInt32BE(v, this.increaseOffset(4))
  }

  public writeUnsignedInt(v: number): void {
    this.buffer.writeUInt32BE(v, this.increaseOffset(4))
  }

  public writeIntLE(v: number): void {
    this.buffer.writeInt32LE(v, this.increaseOffset(4))
  }

  public writeUnsignedIntLE(v: number): void {
    this.buffer.writeUInt32LE(v, this.increaseOffset(4))
  }

  public writeTriad(v: number): void {
    this.buffer.writeIntBE(v, this.increaseOffset(3), 3)
  }

  public writeTriadLE(v: number): void {
    this.buffer.writeIntLE(v, this.increaseOffset(3), 3)
  }

  public writeShort(v: number): void {
    this.buffer.writeInt16BE(v, this.increaseOffset(2))
  }

  public writeUnsignedShort(v: number): void {
    this.buffer.writeUInt16BE(v, this.increaseOffset(2))
  }

  public writeShortLE(v: number): void {
    this.buffer.writeInt16LE(v, this.increaseOffset(2))
  }

  public writeUnsignedShortLE(v: number): void {
    this.buffer.writeUInt16LE(v, this.increaseOffset(2))
  }

  public writeFloat(v: number): void {
    this.buffer.writeFloatBE(v, this.increaseOffset(4))
  }

  public writeFloatLE(v: number): void {
    this.buffer.writeFloatLE(v, this.increaseOffset(4))
  }

  public writeLong(v: bigint): void {
    this.buffer.writeBigInt64BE(v, this.increaseOffset(8))
  }

  public writeLongLE(v: bigint): void {
    this.buffer.writeBigInt64LE(v, this.increaseOffset(8))
  }

  public writeUnsignedVarInt(v: number): void {
    while ((v & 0xffffff80) != 0) {
      this.writeByte((v & 0x7f) | 0x80)
      v >>>= 7
    }
    this.writeByte(v & 0x7f)
  }

  public writeVarInt(v: number): void {
    const val = this.encodeZigZag32(v)
    this.writeUnsignedVarInt(val)
  }

  public writeVarLong(v: bigint): void {
    const val = this.encodeZigZag64(v)
    this.writeUnsignedVarLong(val)
  }

  public writeUnsignedVarLong(v: bigint): void {
    for (let i = 0; i < 10; i++) {
      if (v >> 7n !== 0n) {
        this.writeByte(Number(v | 0x80n))
      } else {
        this.writeByte(Number(v & 0x7fn))
        break
      }
      v >>= 7n
    }
  }

  private encodeZigZag32(v: number): number {
    return (v << 1) ^ (v >> 31)
  }

  private encodeZigZag64(v: bigint): bigint {
    return (v << 1n) ^ (v >> 63n)
  }

  public getBuffer(): Buffer {
    return this.buffer.slice(0, this.offset)
  }

  private increaseOffset(size: number): number {
    if (this.offset + size > this.buffer.byteLength) {
      throw new RangeError('Cannot write more than 2Kib')
    }
    return (this.offset += size) - size
  }
}
