import { BinaryStream } from '@jukebox/binarystream'

import { NBTDefinitions } from './definitions'
import { Endianess } from './endianess'
import { NBTTag } from './tag'
import { NBTTagCompound } from './tag-compound'

export class NBTWriter {
  private readonly endianess: Endianess
  private readonly buf: BinaryStream

  private useVarint = false

  public constructor(out: BinaryStream, endianess: Endianess) {
    this.buf = out
    this.endianess = endianess
  }

  public setUseVarint(useVarint: boolean): void {
    this.useVarint = useVarint
  }

  public writeList<
    Type extends
      | number
      | bigint
      | string
      | Set<NBTTag<any>>
      | NBTTagCompound
      | number[]
  >(list: Set<NBTTag<Type>>): void {
    this.writeTagHeader(NBTDefinitions.TAG_LIST, '')
    this.writeListValue(list)
  }

  public writeCompound(compound: NBTTagCompound): void {
    this.writeTagHeader(NBTDefinitions.TAG_COMPOUND, compound.getName() ?? '')
    this.writeCompoundValue(compound)
  }

  private writeTagHeader(type: number, name: string): void {
    this.writeByteValue(type)
    this.writeStringValue(name)
  }

  private writeStringValue(value: string | null): void {
    if (value !== null) {
      const bytes = Buffer.from(value, 'utf8')
      if (this.useVarint) {
        this.buf.writeUnsignedVarInt(Buffer.byteLength(value))
      } else {
        this.writeShortValue(Buffer.byteLength(value))
      }

      this.buf.write(bytes)
    } else if (this.useVarint) {
      this.writeByteValue(0)
    } else {
      this.writeShortValue(0)
    }
  }

  public writeByteValue(value: number): void {
    this.buf.writeByte(value)
  }

  public writeShortValue(value: number): void {
    if (this.endianess == Endianess.LITTLE_ENDIAN) {
      this.buf.writeShortLE(value)
    } else {
      this.buf.writeShort(value)
    }
  }

  private writeIntegerValue(value: number): void {
    if (this.useVarint) {
      this.buf.writeVarInt(value)
    } else if (this.endianess == Endianess.LITTLE_ENDIAN) {
      this.buf.writeIntLE(value)
    } else {
      this.buf.writeInt(value)
    }
  }

  private writeLongValue(value: bigint): void {
    if (this.useVarint) {
      this.buf.writeVarLong(value)
    } else if (this.endianess == Endianess.LITTLE_ENDIAN) {
      this.buf.writeLongLE(value)
    } else {
      this.buf.writeLong(value)
    }
  }

  private writeFloatValue(value: number): void {
    if (this.endianess == Endianess.LITTLE_ENDIAN) {
      this.buf.writeFloatLE(value)
    } else {
      this.buf.writeFloat(value)
    }
  }

  private writeDoubleValue(value: number): void {
    if (this.endianess == Endianess.LITTLE_ENDIAN) {
      this.buf.writeDoubleLE(value)
    } else {
      this.buf.writeDouble(value)
    }
  }

  private writeByteArrayValue(value: Buffer): void {
    this.writeIntegerValue(value.length)
    this.buf.write(value)
  }

  private writeIntegerArrayValue(value: number[]): void {
    this.writeIntegerValue(value.length)
    for (const v of value) {
      this.writeIntegerValue(v)
    }
  }

  private writeListValue<
    Type extends
      | number
      | bigint
      | string
      | Set<NBTTag<any>>
      | NBTTagCompound
      | number[]
  >(value: Set<NBTTag<Type>>): void {
    if (value.size > 0) {
      const listNbtType = value.values().next().value.getTagType()
      this.writeByteValue(listNbtType)
      this.writeIntegerValue(value.size)
      for (const rawValue of value) {
        switch (listNbtType) {
          case NBTDefinitions.TAG_BYTE:
            this.writeByteValue(rawValue.get() as number)
            break
          case NBTDefinitions.TAG_SHORT:
            this.writeShortValue(rawValue.get() as number)
            break
          case NBTDefinitions.TAG_INT:
            this.writeIntegerValue(rawValue.get() as number)
            break
          case NBTDefinitions.TAG_LONG:
            this.writeLongValue(rawValue.get() as bigint)
            break
          case NBTDefinitions.TAG_FLOAT:
            this.writeFloatValue(rawValue.get() as number)
            break
          case NBTDefinitions.TAG_DOUBLE:
            this.writeDoubleValue(rawValue.get() as number)
            break
          case NBTDefinitions.TAG_BYTE_ARRAY:
            this.writeDoubleValue(rawValue.get() as number)
            break
          case NBTDefinitions.TAG_STRING:
            this.writeStringValue(rawValue.get() as string)
            break
          case NBTDefinitions.TAG_LIST:
            this.writeListValue(rawValue.get() as Set<NBTTag<any>>)
            break
          case NBTDefinitions.TAG_COMPOUND:
            this.writeCompoundValue(rawValue.get() as NBTTagCompound)
            break
          case NBTDefinitions.TAG_INT_ARRAY:
            this.writeIntegerArrayValue(rawValue.get() as number[])
            break
          default:
            throw new Error('Invalid NBTTagType')
        }
      }
    } else {
      this.writeByteValue(NBTDefinitions.TAG_BYTE)
      this.writeIntegerValue(0)
    }
  }

  private writeCompoundValue(compound: NBTTagCompound): void {
    for (const [key, value] of compound.entries()) {
      const nbtType = this.getNBTType(value)
      this.writeTagHeader(nbtType, key)
      switch (nbtType) {
        case NBTDefinitions.TAG_BYTE:
          this.writeByteValue((value as NBTTag<number>).get())
          break
        case NBTDefinitions.TAG_SHORT:
          this.writeShortValue((value as NBTTag<number>).get())
          break
        case NBTDefinitions.TAG_INT:
          this.writeIntegerValue((value as NBTTag<number>).get())
          break
        case NBTDefinitions.TAG_LONG:
          this.writeLongValue((value as NBTTag<bigint>).get())
          break
        case NBTDefinitions.TAG_FLOAT:
          this.writeFloatValue((value as NBTTag<number>).get())
          break
        case NBTDefinitions.TAG_DOUBLE:
          this.writeDoubleValue((value as NBTTag<number>).get())
          break
        case NBTDefinitions.TAG_BYTE_ARRAY:
          this.writeByteArrayValue(value as Buffer)
          break
        case NBTDefinitions.TAG_STRING:
          this.writeStringValue((value as NBTTag<string>).get())
          break
        case NBTDefinitions.TAG_LIST:
          this.writeListValue(value as Set<any>)
          break
        case NBTDefinitions.TAG_COMPOUND:
          this.writeCompoundValue(value as NBTTagCompound)
          break
        case NBTDefinitions.TAG_INT_ARRAY:
          this.writeIntegerArrayValue(value as number[])
          break
        // TODO: long array...
        default:
          throw new Error('Invalid NBTTagType')
      }
    }

    this.writeByteValue(NBTDefinitions.TAG_END)
  }

  private getNBTType<Type>(
    value: NBTTag<Type> | NBTTagCompound | Set<Type> | Buffer | number[]
  ): number {
    if (value instanceof NBTTag) {
      return value.getTagType()
    } else if (value instanceof NBTTagCompound) {
      return NBTDefinitions.TAG_COMPOUND
    } else if (value instanceof Set) {
      return NBTDefinitions.TAG_LIST
    } else if (Array.isArray(value)) {
      return NBTDefinitions.TAG_INT_ARRAY
    } else if (Buffer.isBuffer(value)) {
      return NBTDefinitions.TAG_BYTE_ARRAY
    }

    throw new Error('Invalid NBTTagType')
  }
}
