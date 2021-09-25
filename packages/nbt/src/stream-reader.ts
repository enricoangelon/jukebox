import { BinaryStream } from '@jukebox/binarystream'

import { NBTDefinitions } from './definitions'
import { Endianess } from './endianess'
import { NBTTag } from './tag'

export class NBTStreamReader {
  protected input: BinaryStream
  protected endianess: Endianess

  private useVarint = false
  private allocateLimit = -1

  protected constructor(input: BinaryStream, endianess: Endianess) {
    this.endianess = endianess
    this.input = input
  }

  public setUseVarints(useVarint: boolean): void {
    this.useVarint = useVarint
  }

  public isUsingVarints(): boolean {
    return this.useVarint
  }

  public setAllocateLimit(allocateLimit: number): void {
    this.allocateLimit = allocateLimit
  }

  protected readByteValue(): NBTTag<number> {
    this.expectInput(1, 'Invalid NBT Data: Expected byte')
    return new NBTTag(NBTDefinitions.TAG_BYTE, this.input.readByte())
  }

  protected readStringValue(): NBTTag<string> {
    const length = this.useVarint
      ? this.input.readUnsignedVarInt()
      : this.readShortValue().get()
    this.expectInput(length, 'Invalid NBT Data: Expected string bytes')

    const data = this.input.read(length)
    return new NBTTag(NBTDefinitions.TAG_STRING, data.toString('utf8'))
  }

  protected readShortValue(): NBTTag<number> {
    this.expectInput(2, 'Invalid NBT Data: Expected short')

    if (this.endianess == Endianess.LITTLE_ENDIAN) {
      return new NBTTag(NBTDefinitions.TAG_SHORT, this.input.readShortLE())
    }

    return new NBTTag(NBTDefinitions.TAG_SHORT, this.input.readShort())
  }

  protected readIntValue(): NBTTag<number> {
    if (this.useVarint) {
      return new NBTTag(NBTDefinitions.TAG_INT, this.input.readVarInt())
    }

    this.expectInput(4, 'Invalid NBT Data: Expected int')

    if (this.endianess == Endianess.LITTLE_ENDIAN) {
      return new NBTTag(NBTDefinitions.TAG_INT, this.input.readIntLE())
    }

    return new NBTTag(NBTDefinitions.TAG_INT, this.input.readInt())
  }

  protected readLongValue(): NBTTag<bigint> {
    if (this.useVarint) {
      return new NBTTag(NBTDefinitions.TAG_LONG, this.input.readVarLong())
    }

    this.expectInput(8, 'Invalid NBT Data: Expected long')

    if (this.endianess == Endianess.LITTLE_ENDIAN) {
      return new NBTTag(NBTDefinitions.TAG_LONG, this.input.readLongLE())
    }

    return new NBTTag(NBTDefinitions.TAG_LONG, this.input.readLong())
  }

  protected readFloatValue(): NBTTag<number> {
    this.expectInput(4, 'Invalid NBT Data: Expected long')

    if (this.endianess == Endianess.LITTLE_ENDIAN) {
      return new NBTTag(NBTDefinitions.TAG_FLOAT, this.input.readFloatLE())
    }

    return new NBTTag(NBTDefinitions.TAG_FLOAT, this.input.readFloat())
  }

  protected readDoubleValue(): NBTTag<number> {
    this.expectInput(8, 'Invalid NBT Data: Expected double')

    if (this.endianess == Endianess.LITTLE_ENDIAN) {
      return new NBTTag(NBTDefinitions.TAG_DOUBLE, this.input.readDoubleLE())
    }

    return new NBTTag(NBTDefinitions.TAG_DOUBLE, this.input.readDouble())
  }

  protected readByteArrayValue(): Buffer {
    const size: number = this.readIntValue().get()
    this.expectInput(size, 'Invalid NBT Data: Expected byte array data')
    return this.input.read(size)
  }

  protected readIntArrayValue(): number[] {
    const size: number = this.readIntValue().get()
    this.expectInput(
      this.isUsingVarints() ? size : size * 4,
      'Invalid NBT Data: Expected int array data'
    )
    const result: number[] = []
    for (let i = 0; i < size; i++) {
      result.push(this.readIntValue().get())
    }

    return result
  }

  protected expectInput(
    remaining: number,
    message: string,
    alterAllocationLimit = true
  ): void {
    if (alterAllocationLimit) {
      this.alterAllocationLimit(remaining)
    }

    const length = this.input.getRemaining().length
    this.input.setOffset(this.input.getOffset() - length)
    if (length < remaining) {
      throw new Error(message)
    }
  }

  public alterAllocationLimit(remaining: number): void {
    if (this.allocateLimit !== -1) {
      if (this.allocateLimit - remaining < 0) {
        throw new Error(
          'Could not allocate more bytes due to reaching the set limit'
        )
      } else {
        this.allocateLimit -= remaining
      }
    }
  }
}
