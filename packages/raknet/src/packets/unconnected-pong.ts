import { Packet } from './packet'
import { BinaryStream } from '@jukebox/binarystream'
import { Utils } from '../utils'
import { IPacket } from './i-packet'
import { Identifiers } from '../identifiers'

export class UnconnectedPong extends Packet implements IPacket {
  public serverName: string = ''
  public pingID: number = -1
  public serverID: number = -1

  constructor(stream?: BinaryStream) {
    super(Identifiers.ID_UNCONNECTED_PONG, stream)
  }

  decode() {}

  encode() {
    this.stream.putByte(this.pid)
    this.stream.putLong(this.pingID)
    this.stream.putLong(this.serverID)
    this.stream.putMagic()
    this.stream.putShort(this.serverName.length)
    this.stream.putString(this.serverName)
  }
}
