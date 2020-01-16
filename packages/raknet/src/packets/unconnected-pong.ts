import { Packet, IPacket } from '../protocol/packet'
import { Identifiers } from '../protocol/identifiers'
import { Jukebox } from '@jukebox/core'
import { Socket } from '../socket'

export default class UnconnectedPong extends Packet implements IPacket {
  public static pid = Identifiers.ID_UNCONNECTED_PING

  public pingID: number = this.inputStream.getLong()

  public encode() {
    this.stream.putByte(Identifiers.ID_UNCONNECTED_PONG)

    this.stream.putLong(this.pingID)
    this.stream.putLong(Jukebox.serverID)
    this.stream.putMagic()
    this.stream.putShort(Socket.getRakServerName().getName().length)
    this.stream.putString(Socket.getRakServerName().getName())
  }
}
