import { Packet, IPacket } from '../protocol/packet'
import { RakNetSession } from '../session'
import { Identifiers } from '../protocol/identifiers'

export class ConnectedPing extends Packet implements IPacket {
  public static pid = Identifiers.ID_CONNECTED_PING

  public sendPingTime: number = RakNetSession.getStartTime()

  public encode() {
    this.stream.putByte(ConnectedPing.pid)

    this.stream.putLong(this.sendPingTime)
  }
}