import { Datagram } from '../protocol/datagram'
import { PacketHandler } from '../packet-handler'

export class McpeClientCacheStatus extends Datagram {
  public static readonly NETWORK_ID: number = 0x81

  public toggled: boolean = false

  public mayHaveUnreadBytes = true // 1 unread bytes

  public encodePayload() {
    this.toggled = this.getBool()
  }

  public decodePayload() {
    this.putBool(this.toggled)
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleMcpeClientCacheStatus(this)
  }
}
