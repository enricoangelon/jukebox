import { BinaryStream } from '@jukebox/binarystream'
import { RemoteInfo } from 'dgram'

export class Packet extends BinaryStream {
  // TODO: move to jukebox packet
  public readString(): string {
    const length = this.readUnsignedVarInt()
    const data = this.read(length)
    return data.toString('utf-8')
  }

  public writeString(v: string): void {
    const data = Buffer.from(v, 'ascii')
    this.writeUnsignedVarInt(data.length)
    this.write(data)
  }

  public readAddress(): RemoteInfo {
    const version = this.readByte()
    if (version == 4) {
      const complement = ~this.readUInt()
      const hostname = `${(complement >> 24) & 0xff}.${
        (complement >> 16) & 0xff
      }.${(complement >> 8) & 0xff}.${complement & 0xff}`
      const port = this.readUShort()
      return { address: hostname, port: port, family: 'IPv4' } as RemoteInfo
    } else {
      throw new Error('IPv6 not implemented yet!')
    }
  }
}
