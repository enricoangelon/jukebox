import { Datagram } from '../protocol/datagram'
import { ResourcePack } from '../types/resource-packs/resource-pack'
import { ProtocolIdentifiers } from '../protocol-identifiers'
import { PacketHandler } from '../packet-handler'

export class McpeResourcePackStack extends Datagram {
  public static readonly NETWORK_ID: number = 0x07

  public required: boolean = false
  public behaviorPackStack: ResourcePack[] = []
  public resourcePackStack: ResourcePack[] = []

  public experimental: boolean = false
  public gameVersion: string = ProtocolIdentifiers.MINECRAFT_VERSION

  public decodePayload() {
    this.required = this.getBool()

    let behaviorPackLength = this.getUnsignedVarInt()
    for (let i = 0; i < behaviorPackLength; i++) {
      this.behaviorPackStack.push(<ResourcePack>{
        packID: this.getString(),
        packVersion: this.getString(),
        subPackName: this.getString(),
      })
    }

    let resourcePackLength = this.getUnsignedVarInt()
    for (let i = 0; i < resourcePackLength; i++) {
      this.resourcePackStack.push(<ResourcePack>{
        packID: this.getString(),
        packVersion: this.getString(),
        subPackName: this.getString(),
      })
    }

    this.experimental = this.getBool()
    this.gameVersion = this.getString()
  }

  public encodePayload() {
    this.putBool(this.required)

    this.putUnsignedVarInt(this.behaviorPackStack.length)
    for (let i = 0; i < this.behaviorPackStack.length; i++) {
      let pack = this.behaviorPackStack[i]
      this.putString(pack.packID)
      this.putString(pack.packVersion)
      this.putString(pack.subPackName)
    }

    this.putUnsignedVarInt(this.resourcePackStack.length)
    for (let i = 0; i < this.resourcePackStack.length; i++) {
      let pack = this.resourcePackStack[i]
      this.putString(pack.packID)
      this.putString(pack.packVersion)
      this.putString(pack.subPackName)
    }

    this.putBool(this.experimental)
    this.putString(this.gameVersion)
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleMcpeResourcePackStack(this)
  }
}
