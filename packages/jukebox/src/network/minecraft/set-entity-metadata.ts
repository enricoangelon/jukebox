import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { MetadataContainer } from '../../entity/metadata/container'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeSetEntityMetadata extends DataPacket {
  public runtimeEntityId: bigint
  public metadata: MetadataContainer

  public constructor() {
    super(Protocol.SET_ENTITY_METADATA)
  }

  public encode(stream: WriteStream): void {
    stream.writeUnsignedVarLong(this.runtimeEntityId)
    McpeUtil.writeMetadata(stream, this.metadata)
    stream.writeUnsignedVarLong(0n) // TODO: tick
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
