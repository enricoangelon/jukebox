import { Datagram } from '../protocol/datagram'
import { PacketHandler } from '../packet-handler'
import { PlayStates } from '../types/play-states'

export class McpePlayStatus extends Datagram {
  public static readonly NETWORK_ID: number = 0x02

  public status: number = PlayStates.LOGIN_FAILED_SERVER_FULL // default value convention for now

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
