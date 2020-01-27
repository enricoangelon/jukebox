import { Datagram } from '../protocol/datagram'
import { PacketHandler } from '../packet-handler'

export class McpeChunkRadiusUpdated extends Datagram {
  public static readonly NETWORK_ID: number = 0x46

  public radius: number = 0

  public decodePayload() {
    this.radius = this.getVarInt()
  }

  public encodePayload() {
    this.putVarInt(this.radius)
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleMcpeChunkRadiusUpdated(this)
  }
}
