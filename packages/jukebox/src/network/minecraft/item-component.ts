import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Endianess, NBTTagCompound, NBTWriter } from '../../../../nbt/lib'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

// TODO
interface ItemComponent {
  name: string
  nbt: NBTTagCompound
}

export class McpeItemComponent extends DataPacket {
  public components: Array<ItemComponent>

  public constructor() {
    super(Protocol.ITEM_COMPONENT)
  }

  public encode(stream: WriteStream): void {
    stream.writeUnsignedVarInt(this.components.length)
    for (const component of this.components) {
      McpeUtil.writeString(stream, component.name)

      // TODO
      const writer = new NBTWriter(
        (stream as any) as BinaryStream,
        Endianess.LITTLE_ENDIAN
      )
      writer.setUseVarint(true)

      writer.writeCompound(component.nbt)
    }
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
