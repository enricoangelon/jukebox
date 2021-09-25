import { NBTTagCompound } from '../../../../nbt/lib'
import { Vector3 } from '../../math/vector3'
import { EntityFlag } from '../flag'
import { MetadataFlags } from './flags'
import { Metadata } from './metadata'
import { MetadataType } from './type'

type metadataType = number | bigint | string | NBTTagCompound | Vector3

export class MetadataContainer {
  private readonly metadataHolder: Map<
    number,
    Metadata<metadataType>
  > = new Map()

  public getDataFlag(indexId: MetadataFlags, flagId: EntityFlag): boolean {
    return (
      (indexId == MetadataFlags.PLAYER_FLAGS
        ? this.getByte(indexId) & 0xff
        : this.getLong(indexId) & (1n << BigInt(flagId))) > 0
    )
  }

  public setDataFlag(
    indexId: MetadataFlags,
    flagId: EntityFlag,
    value: boolean
  ): void {
    if (this.getDataFlag(indexId, flagId) != value) {
      if (indexId == MetadataFlags.PLAYER_FLAGS) {
        let flags = this.getByte(indexId)
        flags ^= 1 << flagId
        this.setByte(indexId, flags)
      } else {
        let flags = this.getLong(indexId)
        flags ^= 1n << BigInt(flagId)
        this.setLong(indexId, flags)
      }
    }
  }

  private get(index: number): Metadata<metadataType> | null {
    return this.metadataHolder.get(index) ?? null
  }

  public getBoolean(index: number): boolean {
    return this.getByte(index) != 0
  }

  public setBoolean(index: number, value: boolean): void {
    this.metadataHolder.set(index, new Metadata(MetadataType.BYTE, +value))
  }

  public getByte(index: number): number {
    const value = this.get(index)
    if (value == null) {
      throw new RangeError(`No metadata value stored at index ${index}`)
    }

    if (value.getTypeId() != MetadataType.BYTE) {
      throw new TypeError(`Metadata value type mismatch at index ${index}`)
    }

    return (value as Metadata<number>).getValue()
  }

  public setByte(index: number, value: number): void {
    this.metadataHolder.set(index, new Metadata(MetadataType.BYTE, value))
  }

  public getShort(index: number): number {
    const value = this.get(index)
    if (value == null) {
      throw new RangeError(`No value stored at index ${index}`)
    }

    if (value.getTypeId() != MetadataType.SHORT) {
      throw new TypeError(`Value type mismatch at index ${index}`)
    }

    return (value as Metadata<number>).getValue()
  }

  public setShort(index: number, value: number): void {
    this.metadataHolder.set(index, new Metadata(MetadataType.SHORT, value))
  }

  public getInt(index: number): number {
    const value = this.get(index)
    if (value == null) {
      throw new RangeError(`No value stored at index ${index}`)
    }

    if (value.getTypeId() != MetadataType.INT) {
      throw new TypeError(`Value type mismatch at index ${index}`)
    }

    return (value as Metadata<number>).getValue()
  }

  public setInt(index: number, value: number): void {
    this.metadataHolder.set(index, new Metadata(MetadataType.INT, value))
  }

  public getFloat(index: number): number {
    const value = this.get(index)
    if (value == null) {
      throw new RangeError(`No value stored at index ${index}`)
    }

    if (value.getTypeId() != MetadataType.FLOAT) {
      throw new TypeError(`Value type mismatch at index ${index}`)
    }

    return (value as Metadata<number>).getValue()
  }

  public setFloat(index: number, value: number): void {
    this.metadataHolder.set(index, new Metadata(MetadataType.FLOAT, value))
  }

  public getString(index: number): string {
    const value = this.get(index)
    if (value == null) {
      throw new RangeError(`No value stored at index ${index}`)
    }

    if (value.getTypeId() != MetadataType.STRING) {
      throw new TypeError(`Value type mismatch at index ${index}`)
    }

    return (value as Metadata<string>).getValue()
  }

  public setString(index: number, value: string): void {
    this.metadataHolder.set(index, new Metadata(MetadataType.STRING, value))
  }

  public getNBT(index: number): NBTTagCompound {
    const value = this.get(index)
    if (value == null) {
      throw new RangeError(`No value stored at index ${index}`)
    }

    if (value.getTypeId() != MetadataType.NBT) {
      throw new TypeError(`Value type mismatch at index ${index}`)
    }

    return (value as Metadata<NBTTagCompound>).getValue()
  }

  public setNBT(index: number, value: NBTTagCompound): void {
    this.metadataHolder.set(index, new Metadata(MetadataType.NBT, value))
  }

  public getPosition(index: number): Vector3 {
    const value = this.get(index)
    if (value == null) {
      throw new RangeError(`No value stored at index ${index}`)
    }

    if (value.getTypeId() != MetadataType.POSITION) {
      throw new TypeError(`Value type mismatch at index ${index}`)
    }

    return (value as Metadata<Vector3>).getValue()
  }

  public setPosition(index: number, value: Vector3): void {
    this.metadataHolder.set(index, new Metadata(MetadataType.POSITION, value))
  }

  public getLong(index: number): bigint {
    const value = this.get(index)
    if (value == null) {
      throw new RangeError(`No value stored at index ${index}`)
    }

    if (value.getTypeId() != MetadataType.LONG) {
      throw new TypeError(`Value type mismatch at index ${index}`)
    }

    return (value as Metadata<bigint>).getValue()
  }

  public setLong(index: number, value: bigint): void {
    this.metadataHolder.set(index, new Metadata(MetadataType.LONG, value))
  }

  public getVector(index: number): Vector3 {
    const value = this.get(index)
    if (value == null) {
      throw new RangeError(`No value stored at index ${index}`)
    }

    if (value.getTypeId() != MetadataType.VECTOR) {
      throw new TypeError(`Value type mismatch at index ${index}`)
    }

    return (value as Metadata<Vector3>).getValue()
  }

  public setVector(index: number, value: Vector3): void {
    this.metadataHolder.set(index, new Metadata(MetadataType.VECTOR, value))
  }

  public getMetadataHolder(): Map<number, Metadata<metadataType>> {
    return this.metadataHolder
  }
}
