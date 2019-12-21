import { Packet } from './packet'
import { BinaryStream } from '@jukebox/binarystream'
import { Utils } from '../utils'
import { IPacket } from './i-packet'

export class UnconnectedPong extends Packet implements IPacket {
  public serverName: string = ''
  public pingID: number = -1
  public serverID: number = -1

  constructor(stream?: BinaryStream) {
    super(0x1c, stream)
  }

  decode() {}

  encode() {
    this.stream.putByte(this.pid) //packetID, da mandare in ogni pacchetto, infatti credo sia meglio metterlo nell'encode, poi si vedra'
    this.stream.putLong(this.pingID)
    this.stream.putLong(this.serverID)
    this.stream.append(Buffer.from(Utils.magic, 'binary'))
    this.stream.putShort(this.serverName.length)
    this.stream.putString(this.serverName)
  }
}
