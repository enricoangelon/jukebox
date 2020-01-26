import { Datagram } from '../protocol/datagram'
import { PacketHandler } from '../packet-handler'

export class McpeRequestChunkRadius extends Datagram {
  public static readonly NETWORK_ID: number = 0x45

  public radius: number = 0

  public decodePayload() {
    this.radius = this.getVarInt()
  }

  public encodePayload() {
    this.putVarInt(this.radius)
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleMcpeRequestChunkRadius(this)
  }
}
