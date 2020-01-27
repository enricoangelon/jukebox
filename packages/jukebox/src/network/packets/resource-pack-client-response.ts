import { Datagram } from '../protocol/datagram'
import { ResourcePackClientResponses } from '../types/resource-packs/resource-pack-client-responses'
import { PacketHandler } from '../packet-handler'

export class McpeResourcePackClientResponse extends Datagram {
  public static readonly NETWORK_ID: number = 0x08

  public status: number = ResourcePackClientResponses.STATUS_REFUSED // convention
  public packIdentifiers: string[] = []

  public decodePayload() {
    this.status = this.getByte()
    let entriesLength = this.getLShort()
    for (let i = 0; i < entriesLength; i++) {
      this.packIdentifiers.push(this.getString())
    }
  }

  public encodePayload() {
    this.putByte(this.status)
    this.putLShort(this.packIdentifiers.length)
    for (let i = 0; i < this.packIdentifiers.length; i++) {
      this.putString(this.packIdentifiers[i])
    }
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleResourcePackClientResponse(this)
  }
}
