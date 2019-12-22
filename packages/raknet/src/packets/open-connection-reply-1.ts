import { Packet, IPacket } from '../packet'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../identifiers'
import { RemoteInfo } from 'dgram'
import { Jukebox } from '@jukebox/core'

export default class OpenConnectionReply1 extends Packet implements IPacket {
  public static pid = Identifiers.ID_OPEN_CONNECTION_REPLY_1

  public serverID: number
  public serverSecurity: number
  public mtuSize: number

  constructor(rinfo: RemoteInfo, stream?: BinaryStream) {
    super(rinfo, stream)

    this.serverSecurity = 0 //always 0 according to https://wiki.vg/Pocket_Minecraft_Protocol#0x06
    this.mtuSize = this.stream.getShort()
    this.serverID = Jukebox.serverID
  }

  encode() {
    this.stream.putByte(Identifiers.ID_OPEN_CONNECTION_REPLY_1)
    this.stream.putMagic()
    this.stream.putLong(this.serverID)
    this.stream.putShort(this.serverSecurity)
    this.stream.putShort(this.mtuSize)
  }
}
