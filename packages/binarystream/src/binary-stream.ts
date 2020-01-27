import { Utils } from './utils'

export class BinaryStream {
  private buffer: Buffer
  public offset: number

  constructor(buffer?: Buffer) {
    if (!buffer) {
      buffer = Buffer.alloc(0)
    }

    this.buffer = buffer
    this.offset = 0
  }

  public getByte() {
    //return this.buffer.readUInt8(0) //or maybe 0, it should theorically be 0
    return this.buffer[this.increaseOffset(1)]
  }

  public putByte(v: number): void {
    this.append(Buffer.from([v & 0xff]))
  }

  public getLInt() {
    return this.buffer.readInt32LE(this.increaseOffset(4))
  }

  public getLong() {
    return (
      (this.buffer.readUInt32BE(this.increaseOffset(4)) << 8) +
      this.buffer.readUInt32BE(this.increaseOffset(4))
    )
  }

  //STE FUNZIONI NON SONO OTTIMIZZATE E SONO PRESE DA POCKETNODE; SERVONO SOLO PER TESTARE; POI VERRANNO SOSTITUITE
  public putLong(v: number) {
    let MAX_UINT32 = 0xffffffff

    let buf = Buffer.alloc(8)
    buf.writeUInt32BE(~~(v / MAX_UINT32), 0)
    buf.writeUInt32BE(v & MAX_UINT32, 4)
    this.append(buf)
  }

  public getShort() {
    return this.buffer.readUInt16BE(this.increaseOffset(2))
  }

  public putShort(v: number) {
    let buf = Buffer.alloc(2)
    buf.writeUInt16BE(v, 0)
    this.append(buf)
  }

  public getInt() {
    return this.buffer.readInt32BE(this.increaseOffset(4))
  }

  public getUnsignedVarInt() {
    let value = 0

    for (let i = 0; i <= 35; i += 7) {
      let b = this.getByte()
      value |= (b & 0x7f) << i

      if ((b & 0x80) === 0) {
        return value
      }
    }

    return 0
  }

  public putLLong(v: number) {
    let MAX_UINT32 = 0xffffffff

    let buf = Buffer.alloc(8)
    buf.writeUInt32LE(v & MAX_UINT32, 0)
    buf.writeUInt32LE(~~(v / MAX_UINT32), 4)
    this.append(buf)
  }

  public putLShort(v: number) {
    let buf = Buffer.alloc(2)
    buf.writeUInt16LE(v, 0)
    this.append(buf)
  }

  public reset() {
    this.buffer = Buffer.alloc(0)
    this.offset = 0
  }

  public putBool(v: boolean) {
    this.putByte(v === true ? 1 : 0)
  }

  public getLLong() {
    return this.buffer.readUInt32LE(0) + (this.buffer.readUInt32LE(4) << 8)
  }

  public getLShort() {
    return this.buffer.readUInt16LE(this.increaseOffset(2))
  }

  public getBool() {
    return this.getByte() !== 0
  }

  public get(len: number) {
    return this.buffer.slice(this.offset, this.increaseOffset(len, true))
  }

  public putUnsignedVarInt(v: number) {
    let stream = new BinaryStream()
    for (let i = 0; i < 5; i++) {
      if (v >> 7 !== 0) {
        stream.putByte(v | 0x80)
      } else {
        stream.putByte(v & 0x7f)
        break
      }
      v >>= 7
    }
    this.append(stream.buffer)
  }

  public putString(v: string) {
    this.append(Buffer.from(v, 'utf8'))
  }

  public setBuffer(buffer = Buffer.alloc(0), offset: number = 0) {
    this.buffer = buffer
    this.offset = offset
  }

  public getRemaining() {
    let buf = this.buffer.slice(this.offset)
    this.offset = this.buffer.length
    return buf
  }

  public getAddress() {
    let addr, port
    let version = this.getByte()
    switch (version) {
      default:
      case 4:
        addr = []
        for (let i = 0; i < 4; i++) {
          addr.push(this.getByte() & 0xff)
        }
        addr = addr.join('.')
        port = this.getShort()
        break
      // add ipv6 support
    }
    return { ip: addr, port: port, version: version } // InternetAddress from @raknet
  }

  public putAddress(addr: string, port: number, version: number = 4) {
    this.putByte(version)
    switch (version) {
      default:
      case 4:
        addr.split('.', 4).forEach(b => this.putByte(Number(b) & 0xff))
        this.putShort(port)
        break
    }
  }

  public getLFloat() {
    return this.buffer.readFloatLE(this.increaseOffset(4))
  }

  public getVarInt() {
    let raw = this.getUnsignedVarInt()
    let tmp = (((raw << 63) >> 63) ^ raw) >> 1
    return tmp ^ (raw & (1 << 63))
  }

  public getVarLong() {
    let raw = this.getUnsignedVarLong()
    let tmp = (((raw << 63) >> 63) ^ raw) >> 1
    return tmp ^ (raw & (1 << 63))
  }

  public getUnsignedVarLong() {
    let value = 0
    for (let i = 0; i <= 63; i += 7) {
      let b = this.getByte()
      value |= (b & 0x7f) << i

      if ((b & 0x80) === 0) {
        return value
      }
    }
    return 0
  }

  public putVarInt(v: number) {
    v <<= 32 >> 32
    return this.putUnsignedVarInt((v << 1) ^ (v >> 31))
  }

  public putVarLong(v: number) {
    return this.putUnsignedVarLong((v << 1) ^ (v >> 63))
  }

  public putLFloat(v: number) {
    let buf = Buffer.alloc(8)
    let bytes = buf.writeFloatLE(v, 0)
    this.append(buf.slice(0, bytes))
  }

  public putUnsignedVarLong(v: number) {
    for (let i = 0; i < 10; i++) {
      if (v >> 7 !== 0) {
        this.putByte(v | 0x80)
      } else {
        this.putByte(v & 0x7f)
        break
      }
      v >>= 7
    }
  }

  public putLInt(v: number) {
    let buf = Buffer.alloc(4)
    buf.writeInt32LE(v, 0)
    this.append(buf)
  }

  public putInt(v: number) {
    let buf = Buffer.alloc(4)
    buf.writeInt32BE(v, 0)
    this.append(buf)
  }

  public getLTriad() {
    return this.buffer.readUIntLE(this.increaseOffset(3), 3)
  }

  public putLTriad(v: number) {
    let buf = Buffer.alloc(3)
    buf.writeUIntLE(v, 0, 3)
    this.append(buf)
  }

  public getMagic() {
    return this.buffer.slice(this.offset, (this.offset += 16))
  }

  public putMagic() {
    this.append(Buffer.from(Utils.magic, 'binary'))
  }

  public flip() {
    this.offset = 0
  }

  public append(buf: string | Buffer | number[]) {
    if (buf instanceof Buffer) {
      this.buffer = Buffer.concat([this.buffer, buf])
      this.offset += buf.length
    } else if (typeof buf === 'string') {
      buf = Buffer.from(buf, 'hex')
      this.buffer = Buffer.concat([this.buffer, buf])
      this.offset += buf.length
    } else if (Array.isArray(buf)) {
      buf = Buffer.from(buf)
      this.buffer = Buffer.concat([this.buffer, buf])
      this.offset += buf.length
    }
  }

  public getString(): string {
    return this.getUnsignedVarInt().toString()
  }

  public increaseOffset(v: number, ret: boolean = false) {
    return ret === true ? (this.offset += v) : (this.offset += v) - v
  }

  public feof() {
    return typeof this.buffer[this.offset] === 'undefined'
  }

  public getBuffer(): Buffer {
    return this.buffer
  }
}
