export class BinaryStream {
  private buffer: Buffer
  private offset: number

  constructor(buffer?: Buffer) {
    if (!buffer) {
      buffer = Buffer.alloc(0)
    }

    this.buffer = buffer
    this.offset = 0
  }

  public getByte() {
    return this.buffer.readUInt8(0) //or maybe 0, it should theorically be 0
  }

  public putByte(v: number): void {
    Buffer.concat([this.buffer, Buffer.from([v & 0xff])])
  }

  public getLong() {
    return this.buffer.readUInt32LE(0) + (this.buffer.readUInt32LE(4) << 8)
  }

  //STE FUNZIONI NON SONO OTTIMIZZATE E SONO PRESE DA POCKETNODE; SERVONO SOLO PER TESTARE; POI VERRANNO SOSTITUITE
  putLong(v: number) {
    let MAX_UINT32 = 0xffffffff

    let buf = Buffer.alloc(8)
    buf.writeUInt32BE(~~(v / MAX_UINT32), 0)
    buf.writeUInt32BE(v & MAX_UINT32, 4)
    Buffer.concat([this.buffer, buf])
  }

  //getShort

  putShort(v: number) {
    let buf = Buffer.alloc(2)
    buf.writeUInt16BE(v, 0)
    Buffer.concat([this.buffer, buf])
  }

  putString(v: string) {
    Buffer.concat([this.buffer, Buffer.from(v, 'utf8')])
  }

  public getBuffer(): Buffer {
    return this.buffer
  }
}
