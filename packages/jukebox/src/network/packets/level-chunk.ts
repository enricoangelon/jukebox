import { Datagram } from '../protocol/datagram'
import { PacketHandler } from '../packet-handler'

export class McpeLevelChunk extends Datagram {
  public static readonly NETWORK_ID: number = 0x3a

  public chunkX: number = 0
  public chunkZ: number = 0
  public subChunkCount: number = 0
  public cacheEnabled: boolean = false
  public usedBlobHashes: number[] = []
  public extraPayload: string = ''

  public decodePayload() {
    this.chunkX = this.getVarInt()
    this.chunkZ = this.getVarInt()
    this.subChunkCount = this.getUnsignedVarInt()
    this.cacheEnabled = this.getBool()
    if (this.cacheEnabled) {
      for (let i = 0, count = this.getUnsignedVarInt(); i < count; ++i) {
        this.usedBlobHashes.push(this.getLLong())
      }
    }
    this.extraPayload = this.getString()
  }

  public encodePayload() {
    this.putVarInt(this.chunkX)
    this.putVarInt(this.chunkZ)
    this.putUnsignedVarInt(this.subChunkCount)
    this.putBool(this.cacheEnabled)
    if (this.cacheEnabled) {
      this.putUnsignedVarInt(this.usedBlobHashes.length)
      for (let i = 0; i < this.usedBlobHashes.length; i++) {
        this.putLLong(this.usedBlobHashes[i])
      }
    }
    this.putString(this.extraPayload)
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleMcpeLevelChunk(this)
  }
}
