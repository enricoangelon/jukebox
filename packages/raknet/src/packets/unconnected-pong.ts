import { Packet, IPacket } from '../protocol/packet'
import { Identifiers } from '../protocol/identifiers'
import { Jukebox } from '@jukebox/core'
import { Socket } from '../socket'

export default class UnconnectedPong extends Packet implements IPacket {
  public pid = Identifiers.ID_UNCONNECTED_PONG //to send
  public static pid = Identifiers.ID_UNCONNECTED_PING // server search for

  public pingID: number = this.inputStream.getLong()

  public encode() {
    this.stream.putLong(this.pingID)
    this.stream.putLong(Jukebox.serverID)
    this.stream.putMagic()
    this.stream.putShort(Socket.getRakServerName().getName().length)
    this.stream.putString(Socket.getRakServerName().getName())
  }
}
