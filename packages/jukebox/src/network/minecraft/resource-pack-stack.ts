import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { ResourcePackStack } from '../../resourcepack/resource-pack-stack'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeResourcePackStack extends DataPacket {
  public forceAccept: boolean
  public behaviorPacks: Array<ResourcePackStack>
  public resourcePacks: Array<ResourcePackStack>
  public experiments: Array<any>
  public alreadyEnabledExperiments: boolean

  public constructor() {
    super(Protocol.RESOURCE_PACK_STACK)
  }

  public encode(stream: WriteStream): void {
    stream.writeBoolean(this.forceAccept)
    stream.writeUnsignedVarInt(this.behaviorPacks.length)
    for (const behaviorPack of this.behaviorPacks) {
      McpeUtil.writeResourcePackStack(stream, behaviorPack)
    }
    stream.writeUnsignedVarInt(this.resourcePacks.length)
    for (const resourcePack of this.resourcePacks) {
      McpeUtil.writeResourcePackStack(stream, resourcePack)
    }
    McpeUtil.writeString(stream, '*') // BDS actually sends this char, so we do the same
    stream.writeUnsignedIntLE(this.experiments.length)
    stream.writeBoolean(this.alreadyEnabledExperiments)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
