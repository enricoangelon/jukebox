import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { BehaviorPackInfo } from '../../resourcepack/behavior-pack-info'
import { ResourcePackInfo } from '../../resourcepack/resource-pack-info'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeResourcePacksInfo extends DataPacket {
  public mustAccept: boolean
  public hasScripts: boolean
  public forceAccept: boolean
  public behaviorPacks: Array<BehaviorPackInfo>
  public resourcePacks: Array<ResourcePackInfo>

  public constructor() {
    super(Protocol.RESOURCE_PACKS_INFO)
  }

  public encode(stream: WriteStream): void {
    stream.writeBoolean(this.mustAccept)
    stream.writeBoolean(this.hasScripts)
    stream.writeBoolean(this.forceAccept)
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
