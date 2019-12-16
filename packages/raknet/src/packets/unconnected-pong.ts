import { Packet } from './packet'
import { BinaryStream } from '@jukebox/binarystream'

export class UnconnectedPong extends Packet {
  public pingID: number = -1
  public serverID: number = -1

  constructor(stream?: BinaryStream) {
    super(0x01, stream)
  }

  decode() {
    this.pingID = this.stream.getLong()
  }

  encode() {
    this.stream.putLong(this.pingID)
    this.stream.putLong(this.serverID)
    Buffer.concat([
      this.stream.getBuffer(),
      Buffer.from(
        '\x00\xff\xff\x00\xfe\xfe\xfe\xfe\xfd\xfd\xfd\xfd\x12\x34\x56\x78',
        'binary'
      ),
    ]) //write magic
    let serverName = 'MCPE;Jukebox server;105;1.14;0;9000'
    this.stream.putShort(serverName.length)
    this.stream.putString(serverName)
  }
}
