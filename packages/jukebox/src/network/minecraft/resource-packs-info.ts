import { BinaryStream } from '@jukebox/binarystream'
import { DataPacket } from './internal/data-packet'
import { Protocol } from '../protocol'
import { BehaviorPackInfo } from '../../resourcepack/behavior-pack-info'
import { ResourcePackInfo } from '../../resourcepack/resource-pack-info'
import { McpeUtil } from '../mcpe-util'

export class McpeResourcePacksInfo extends DataPacket {
  public mustAccept: boolean
  public hasScripts: boolean
  public behaviorPacks: Array<BehaviorPackInfo>
  public resourcePacks: Array<ResourcePackInfo>

  public constructor() {
    super(Protocol.RESOURCE_PACKS_INFO)
  }

  public encode(stream: BinaryStream): void {
    stream.writeBoolean(this.mustAccept)
    stream.writeBoolean(this.hasScripts)
    stream.writeUnsignedShortLE(this.behaviorPacks.length)
    for (const behaviorPack of this.behaviorPacks) {
      McpeUtil.writeBehaviorPackInfo(stream, behaviorPack)
    }
    stream.writeUnsignedShortLE(this.resourcePacks.length)
    for (const resourcePack of this.resourcePacks) {
      McpeUtil.writeResourcePackInfo(stream, resourcePack)
    }
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
