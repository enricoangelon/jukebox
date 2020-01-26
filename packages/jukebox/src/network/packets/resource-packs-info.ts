import { Datagram } from '../protocol/datagram'
import { ResourcePack } from '../types/resource-packs/resource-pack'
import { PacketHandler } from '../packet-handler'

export class McpeResourcePacksInfo extends Datagram {
  public static readonly NETWORK_ID: number = 0x06

  public isRequired: boolean = false // is client forced to accept?
  public hasScripts: boolean = false // does it contains scripts?

  public behaviorPackList: ResourcePack[] = []
  public resourcePackList: ResourcePack[] = []

  public decodePayload() {
    this.isRequired = this.getBool()
    this.hasScripts = this.getBool()
    let behaviorPacklength = this.getLShort()
    for (let i = 0; i < behaviorPacklength; i++) {
      this.behaviorPackList.push(<ResourcePack>{
        packID: this.getString(),
        packVersion: this.getString(),
        packSize: this.getLLong(),
        encryptionKey: this.getString(),
        subPackName: this.getString(),
        contentID: this.getString(),
        hasScripts: this.getBool(),
      })
    }
    let resourcePackLength = this.getLShort()
    for (let i = 0; i < resourcePackLength; i++) {
      this.resourcePackList.push(<ResourcePack>{
        packID: this.getString(),
        packVersion: this.getString(),
        packSize: this.getLLong(),
        encryptionKey: this.getString(),
        subPackName: this.getString(),
        contentID: this.getString(),
        hasScripts: this.getBool(),
      })
    }
  }

  public encodePayload() {
    this.putBool(this.isRequired)
    this.putBool(this.hasScripts)
    this.putLShort(this.behaviorPackList.length)
    for (let i = 0; i < this.behaviorPackList.length; i++) {
      let behaviorPack = this.behaviorPackList[i]
      this.putString(behaviorPack.packID)
      this.putString(behaviorPack.packVersion)
      this.putLLong(behaviorPack.packSize)
      this.putString(behaviorPack.encryptionKey)
      this.putString(behaviorPack.subPackName)
      this.putBool(behaviorPack.hasScripts)
    }
    this.putLShort(this.resourcePackList.length)
    for (let i = 0; i < this.resourcePackList.length; i++) {
      let resourcePack = this.resourcePackList[i]
      this.putString(resourcePack.packID)
      this.putString(resourcePack.packVersion)
      this.putLLong(resourcePack.packSize)
      this.putString(resourcePack.encryptionKey)
      this.putString(resourcePack.subPackName)
      this.putBool(resourcePack.hasScripts)
    }
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleResourcePacksInfo(this)
  }
}
