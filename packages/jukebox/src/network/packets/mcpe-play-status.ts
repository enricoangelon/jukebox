import { Datagram } from '../protocol/datagram'
import { PacketHandler } from '../packet-handler'

export class McpePlayStatus extends Datagram {
  public pid: number = 0x02
  public static pid: number = 0x02

  public status: number = -1

  public allowBeforeLogin: boolean = true

  public decodePayload() {
    this.status = this.getInt()
  }

  public encodePayload() {
    this.putInt(this.status)
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleMcpePlayStatus(this)
  }
}
