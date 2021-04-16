import { BinaryStream } from '@jukebox/binarystream'
import { DataPacket } from './internal/data-packet'
import { Protocol } from '../protocol'

export class McpeResourcePacksInfo extends DataPacket {
  public mustAccept: boolean
  public hasScripts: boolean
  public behaviorPacks: Array<any>
  public resourcePacks: Array<any>

  public constructor() {
    super(Protocol.RESOURCE_PACKS_INFO)
  }

  public encode(stream: BinaryStream): void {
    stream.writeBoolean(this.mustAccept)
    stream.writeBoolean(this.hasScripts)
    stream.writeUnsignedShortLE(0)
    stream.writeUnsignedShortLE(0)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
