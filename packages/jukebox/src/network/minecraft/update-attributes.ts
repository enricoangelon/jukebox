import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { AttributeContainer } from '../../entity/attribute/container'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeUpdateAttributes extends DataPacket {
  public uniqueEntityId: bigint
  public attributes: AttributeContainer

  public constructor() {
    super(Protocol.UPDATE_ATTRIBUTES)
  }

  public encode(stream: WriteStream): void {
    stream.writeUnsignedVarLong(this.uniqueEntityId)
    McpeUtil.writeAttributes(stream, this.attributes)
    stream.writeUnsignedVarLong(0n) // tick
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
