import { Packet, IPacket } from '../protocol/packet'
import { Identifiers } from '../protocol/identifiers'
import { Jukebox } from '@jukebox/core'
import { RakNetSession } from '../session'

export default class OpenConnectionReply2 extends Packet implements IPacket {
  public pid = Identifiers.ID_OPEN_CONNECTION_REPLY_2
  public static pid = Identifiers.ID_OPEN_CONNECTION_REQUEST_2

  public clientPort: number = this.rinfo.port
  public mtuSize: number = this.inputStream.getShort()

  public encode() {
    this.stream.putMagic()
    this.stream.putLong(Jukebox.serverID)
    this.stream.putShort(this.clientPort)
    this.stream.putShort(this.mtuSize)
    this.stream.putByte(0) //serverSecurity

    // create client session
    RakNetSession.create(
      this.rinfo.address,
      this.rinfo.port,
      this.inputStream.getLong(),
      this.mtuSize
    )
  }
}
