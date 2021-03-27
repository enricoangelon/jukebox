import { assert } from 'console'

export class BinaryStream {
  private buffer: Buffer
  private offset: number

  public constructor(buffer = Buffer.alloc(0), offset = 0) {
    this.buffer = buffer
    this.offset = offset
  }

  public skip(len: number): void {
    assert(Number.isInteger(len), 'Cannot skip a float amount of bytes')
    this.offset += len
  }

  public readByte(): number {
    return this.buffer.readUInt8(this.offset++)
  }

  public writeByte(v: number): void {
    this.write(Buffer.from([v & 0xff]))
  }

  public readBoolean(): boolean {
    return !!this.readByte()
  }

  public writeBoolean(v: boolean): void {
    this.writeByte(+v)
  }

  public read(len: number): Buffer {
    assert(Number.isInteger(len), 'Cannot read a float amount of bytes')
    return this.buffer.slice(this.offset, (this.offset += len))
  }

  public write(buf: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, buf])
    this.offset += Buffer.byteLength(buf)
  }

  public readInt(): number {
    return this.buffer.readInt32BE((this.offset += 4) - 4)
  }

  public writeInt(v: number): void {
    const buf = Buffer.alloc(4)
    buf.writeInt32BE(v, 0)
    this.write(buf)
  }

  public readTriad(): number {
    return this.buffer.readIntBE((this.offset += 3) - 3, 3)
  }

  public writeTriad(v: number): void {
    const buf = Buffer.alloc(3)
    buf.writeIntBE(v, 0, 3)
    this.write(buf)
  }

  public readTriadLE(): number {
    return this.buffer.readIntLE((this.offset += 3) - 3, 3)
  }

  public writeTriadLE(v: number): void {
    const buf = Buffer.alloc(3)
    buf.writeIntLE(v, 0, 3)
    this.write(buf)
  }

  public readShort(): number {
    return this.buffer.readInt16BE((this.offset += 2) - 2)
  }

  public writeShort(v: number): void {
    const buf = Buffer.alloc(2)
    buf.writeInt16BE(v, 0)
    this.write(buf)
  }

  public readUnsignedShort(): number {
    return this.buffer.readUInt16BE((this.offset += 2) - 2)
  }

  public writeUnsignedShort(v: number): void {
    const buf = Buffer.alloc(2)
    buf.writeUInt16BE(v, 0)
    this.write(buf)
  }

  public readFloat(): number {
    return this.buffer.readFloatBE((this.offset += 4) - 4)
  }

  public writeFloat(v: number): void {
    const buf = Buffer.alloc(4)
    buf.writeFloatBE(v, 0)
    this.write(buf)
  }

  public getRemaining(): Buffer {
    const remaining = this.buffer.length - this.offset
    return this.buffer.slice((this.offset += remaining) - remaining)
  }

  public readLong(): bigint {
    return this.buffer.readBigInt64BE((this.offset += 8) - 8)
  }

  public writeLong(v: bigint): void {
    const buf = Buffer.alloc(8)
    buf.writeBigInt64BE(v)
    this.write(buf)
  }

  public readUnsignedInt(): number {
    return this.buffer.readUInt32BE((this.offset += 4) - 4)
  }

  public writeUnsignedInt(v: number): void {
    const buf = Buffer.alloc(4)
    buf.writeUInt32BE(v, 0)
    this.write(buf)
  }

  private encodeZigZag32(v: number): number {
    return (v << 1) ^ (v >> 31)
  }

  private decodeZigZag32(v: number): number {
    return (v >> 1) ^ -(v & 1)
  }

  private encodeZigZag64(v: bigint): bigint {
    return (v << 1n) ^ (v >> 63n)
  }

  private decodeZigZag64(v: bigint): bigint {
    return (v >> 1n) ^ -(v & 1n)
  }

  public readUnsignedVarInt(): number {
    let value = 0,
      i = 0,
      b

    while (((b = this.readByte()) & 0x80) != 0) {
      value |= (b & 0x7f) << i
      i += 7
      if (i > 35) {
        throw new Error('VarInt too big')
      }
    }

    return value | (b << i)
  }

  public writeUnsignedVarInt(v: number): void {
    while ((v & 0xffffff80) != 0) {
      this.writeByte((v & 0x7f) | 0x80)
      v >>>= 7
    }

    this.writeByte(v & 0x7f)
  }

  public readSignedVarInt(): number {
    const val = this.readUnsignedVarInt()
    return this.decodeZigZag32(val)
  }

  public writeSignedVarInt(v: number): void {
    const val = this.encodeZigZag32(v)
    this.writeUnsignedVarInt(val)
  }

  public setOffset(v: number): void {
    assert(v >= 0, 'BinaryStream offset cannot be negative')
    this.offset = v
  }

  public getOffset(): number {
    return this.offset
  }

  public getBuffer(): Buffer {
    return this.buffer
  }

  public feof(): boolean {
    assert(Number.isInteger(this.offset), 'The buffer offset is not an integer')
    return this.getBuffer().byteLength == this.offset
  }
}
