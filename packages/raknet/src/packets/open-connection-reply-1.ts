import { Packet, IPacket } from '../protocol/packet'
import { Identifiers } from '../protocol/identifiers'
import { Jukebox } from '@jukebox/core'

export default class OpenConnectionReply1 extends Packet implements IPacket {
  public static pid = Identifiers.ID_OPEN_CONNECTION_REQUEST_1

  // TODO: Verify that this should be 0 (https://wiki.vg/Pocket_Minecraft_Protocol#0x06)
  public serverSecurity: number = 0
  public mtuSize: number = this.inputStream.getShort()

  public encode() {
    this.stream.putByte(Identifiers.ID_OPEN_CONNECTION_REPLY_1)

    this.stream.putMagic()
    this.stream.putLong(Jukebox.serverID)
    this.stream.putShort(this.serverSecurity)
    this.stream.putShort(this.mtuSize)
  }
}
