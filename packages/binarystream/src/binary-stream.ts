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

  public readSignedByte(): number {
    return this.buffer.readInt8(this.offset++)
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

  public write(arr: Uint8Array): void
  public write(buf: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, buf])
    this.offset += buf.byteLength
  }

  public readInt(): number {
    return this.buffer.readInt32BE((this.offset += 4) - 4)
  }

  public readIntLE(): number {
    return this.buffer.readInt32LE((this.offset += 4) - 4)
  }

  public writeIntLE(v: number): void {
    const buf = Buffer.alloc(4)
    buf.writeInt32LE(v)
    this.write(buf)
  }

  public readUnsignedIntLE(): number {
    return this.buffer.readUInt32LE((this.offset += 4) - 4)
  }

  public writeUnsignedIntLE(v: number): void {
    const buf = Buffer.alloc(4)
    buf.writeUInt32LE(v, 0)
    this.write(buf)
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

  public readShortLE(): number {
    return this.buffer.readInt16LE((this.offset += 2) - 2)
  }

  public writeShort(v: number): void {
    const buf = Buffer.alloc(2)
    buf.writeInt16BE(v)
    this.write(buf)
  }

  public writeShortLE(v: number): void {
    const buf = Buffer.alloc(2)
    buf.writeInt16LE(v)
    this.write(buf)
  }

  public writeUnsignedShortLE(v: number): void {
    const buf = Buffer.alloc(2)
    buf.writeUInt16LE(v)
    this.write(buf)
  }

  public readUnsignedShortLE(): number {
    return this.buffer.readUInt16LE((this.offset += 2) - 2)
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

  public readFloatLE(): number {
    return this.buffer.readFloatLE((this.offset += 4) - 4)
  }

  public writeFloatLE(v: number): void {
    const buf = Buffer.alloc(4)
    buf.writeFloatLE(v)
    this.write(buf)
  }

  public writeFloat(v: number): void {
    const buf = Buffer.alloc(4)
    buf.writeFloatBE(v)
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

  public readLongLE(): bigint {
    return this.buffer.readBigInt64LE((this.offset += 8) - 8)
  }

  public writeLongLE(v: bigint): void {
    const buf = Buffer.alloc(8)
    buf.writeBigInt64LE(v)
    this.write(buf)
  }

  public readUnsignedInt(): number {
    return this.buffer.readUInt32BE((this.offset += 4) - 4)
  }

  public writeUnsignedInt(v: number): void {
    const buf = Buffer.alloc(4)
    buf.writeUInt32BE(v)
    this.write(buf)
  }

  public writeDoubleLE(v: number): void {}

  public writeDouble(v: number): void {}

  public readDoubleLE(): number {
    return 0
  }

  public readDouble(): number {
    return 0
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

  public readVarInt(): number {
    const val = this.readUnsignedVarInt()
    return this.decodeZigZag32(val)
  }

  public writeVarInt(v: number): void {
    const val = this.encodeZigZag32(v)
    this.writeUnsignedVarInt(val)
  }

  public readVarLong(): bigint {
    // TODO: fix and use encode zigzag function
    const raw = this.readUnsignedVarLong()
    const val = (((raw << 63n) >> 63n) ^ raw) >> 1n
    return val ^ (raw & (1n << 63n))
  }

  public writeVarLong(v: bigint): void {
    const val = this.encodeZigZag64(v)
    this.writeUnsignedVarLong(val)
  }

  public readUnsignedVarLong(): bigint {
    let value = 0
    for (let i = 0; i <= 63; i += 7) {
      if (this.feof()) {
        throw new Error('No bytes left in buffer')
      }
      const b = this.readByte()
      value |= (b & 0x7f) << i

      if ((b & 0x80) === 0) {
        return BigInt(value)
      }
    }

    throw new Error('VarLong did not terminate after 10 bytes!')
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
