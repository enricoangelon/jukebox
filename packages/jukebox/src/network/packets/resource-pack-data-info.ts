import { Datagram } from '../protocol/datagram'
import { PacketHandler } from '../packet-handler'
import { ResourcePackTypes } from '../types/resource-packs/resource-pack-types'

export class McpeResourcePackDataInfo extends Datagram {
  public static readonly NETWORK_ID: number = 0x52

  public packId: string = ''
  public maxChunkSize: number = 0
  public chunkCount: number = 0
  public compressedPackSize: number = 0
  public sha256: string = ''
  public premium: boolean = false
  public packType: number = ResourcePackTypes.RESOURCES

  public decodePayload() {
    this.packId = this.getString()
    this.maxChunkSize = this.getLInt()
    this.chunkCount = this.getLInt()
    this.compressedPackSize = this.getLLong()
    this.sha256 = this.getString()
    this.premium = this.getBool()
    this.packType = this.getByte()
  }

  public encodePayload() {
    this.putString(this.packId)
    this.putLInt(this.maxChunkSize)
    this.putLInt(this.chunkCount)
    this.putLLong(this.compressedPackSize)
    this.putString(this.sha256)
    this.putBool(this.premium)
    this.putByte(this.packType)
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleMcpeResourcePackDataInfo(this)
  }
}
