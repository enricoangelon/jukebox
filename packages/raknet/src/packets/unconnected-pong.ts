import { Packet } from './packet'
import { BinaryStream } from '@jukebox/binarystream'
import { Utils } from '../utils'

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
    this.stream.putByte(this.pid) //packetID, da mandare in ogni paccketto, infatti credo sia meglio metterlo nell'encode, poi si vedra'
    this.stream.putLong(this.pingID)
    this.stream.putLong(this.serverID)
    Buffer.concat([this.stream.getBuffer(), Buffer.from(Utils.magic, 'binary')])
    //TODO: prendere dati da config...
    let serverName =
      'MCPE;Jukebox server;105;1.14;0;9000' /* gameType, MOTD, Game Protocol Version, Game Version, Online, Max Online */
    this.stream.putShort(serverName.length)
    this.stream.putString(serverName)
  }
}
