import { Packet } from './packet'
import { IPacket } from './i-packet'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../identifiers'

export class OpenConnectionReply2 extends Packet implements IPacket {
  public serverID: number = -1
  public clientPort: number = -1
  public mtuSize: number = -1
  public serverSecurity: number = -1
  constructor(stream?: BinaryStream) {
    super(Identifiers.ID_OPEN_CONNECTION_REPLY_2, stream)
  }

  decode() {}

  encode() {
    this.stream.putByte(this.pid)
    this.stream.putMagic()
    this.stream.putLong(this.serverID)
    this.stream.putShort(this.clientPort)
    this.stream.putShort(this.mtuSize)
    this.stream.putByte(this.serverSecurity)
  }
}
