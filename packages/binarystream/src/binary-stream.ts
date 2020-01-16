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

  public increaseOffset(v: number) {
    return (this.offset += v) - v
  }

  public feof() {
    return typeof this.buffer[this.offset] === 'undefined'
  }

  public getBuffer(): Buffer {
    return this.buffer
  }
}
