import { BinaryStream } from '@jukebox/binarystream'
import { Endianess } from './endianess'
import { NBTReader } from './reader'
import { NBTTag } from './tag'
import { NBTWriter } from './writer'
import { readFileSync } from 'fs'

export class NBTTagCompound {
  private name: string | null
  public readonly children: Map<string, any> = new Map()

  public static readFromFile(
    path: string,
    endianess: Endianess
  ): NBTTagCompound {
    return NBTTagCompound.readFromStream(
      new BinaryStream(readFileSync(path)),
      endianess
    )
  }

  public static readFromStream(
    input: BinaryStream,
    endianess: Endianess
  ): NBTTagCompound {
    const reader: NBTReader = new NBTReader(input, endianess)
    return reader.parse()
  }

  public constructor(name: string | null = null) {
    this.name = name
  }

  public setName(name: string): void {
    this.name = name
  }

  public getName(): string | null {
    return this.name
  }

  public addValue<Type>(
    name: string,
    value: NBTTag<Type> | NBTTagCompound | Set<Type> | Buffer | number[]
  ): void {
    if (value instanceof NBTTagCompound && !(name === value.getName())) {
      throw new Error(
        `Failed to add NBTTagCompound with name ${value.getName()} given name ${name}`
      )
    }

    this.children.set(name, value)
  }

  public addChild(tag: NBTTagCompound): void {
    this.children.set(tag.getName()!, tag)
  }

  public getList<Type>(name: string, insert: boolean): Set<Type> | null {
    if (this.children.has(name)) {
      return this.children.get(name)
    }

    if (insert) {
      const backingList: Set<Type> = new Set()
      this.addValue(name, backingList)
      return backingList
    }

    return null
  }

  public getCompound(name: string, insert: boolean): NBTTagCompound | null {
    if (this.children.has(name)) {
      return this.children.get(name)
    }

    if (insert) {
      const compound: NBTTagCompound = new NBTTagCompound()
      this.addValue(name, compound)
      return compound
    }

    return null
  }

  public writeToStream(out: BinaryStream, endianess: Endianess): void {
    const writer: NBTWriter = new NBTWriter(out, endianess)
    writer.writeCompound(this)
  }

  public getByte(name: string, defaultValue: number): number {
    return this.children.has(name)
      ? (this.children.get(name) as NBTTag<number>).get()
      : defaultValue
  }

  public getShort(name: string, defaultValue: number): number {
    return this.children.has(name)
      ? (this.children.get(name) as NBTTag<number>).get()
      : defaultValue
  }

  public getNumber(name: string, defaultValue: number): number {
    return this.children.has(name)
      ? (this.children.get(name) as NBTTag<number>).get()
      : defaultValue
  }

  public getLong(name: string, defaultValue: bigint): bigint {
    return this.children.has(name)
      ? (this.children.get(name) as NBTTag<bigint>).get()
      : defaultValue
  }

  public getFloat(name: string, defaultValue: number): number {
    return this.children.has(name)
      ? (this.children.get(name) as NBTTag<number>).get()
      : defaultValue
  }

  public getDouble(name: string, defaultValue: number): number {
    return this.children.has(name)
      ? (this.children.get(name) as NBTTag<number>).get()
      : defaultValue
  }

  public getString(name: string, defaultValue: string): string {
    return this.children.has(name)
      ? (this.children.get(name) as NBTTag<string>).get()
      : defaultValue
  }

  public getByteArray(name: string, defaultValue: Buffer): Buffer {
    return this.children.has(name)
      ? (this.children.get(name) as Buffer)
      : defaultValue
  }

  public remove(key: string): boolean {
    return this.children.delete(key)
  }

  public entries<Type>(): IterableIterator<
    [string, NBTTag<Type> | NBTTagCompound | Set<Type> | Buffer | number[]]
  > {
    return this.children.entries()
  }

  public has(key: string): boolean {
    return this.children.has(key)
  }

  public size(): number {
    return this.children.size
  }

  // Thanks stackoverflow! https://stackoverflow.com/questions/35948335/how-can-i-check-if-two-map-objects-are-equal
  public equals(that: NBTTagCompound): boolean {
    if (this.children.size !== that.children.size) {
      return false
    }

    for (const [key, val] of this.children) {
      const testVal = that.children.get(key)

      if (testVal === undefined && !that.children.has(key)) {
        return false
      }

      if (
        val instanceof NBTTagCompound &&
        testVal instanceof NBTTagCompound &&
        !val.equals(testVal)
      ) {
        return false
      }

      /* 
      if (
        val instanceof ByteVal &&
        testVal instanceof ByteVal &&
        val.getValue() !== testVal.getValue()
      ) {
        return false
      }

      if (
        val instanceof DoubleVal &&
        testVal instanceof DoubleVal &&
        val.getValue() !== testVal.getValue()
      ) {
        return false
      }

      if (
        val instanceof FloatVal &&
        testVal instanceof FloatVal &&
        val.getValue() !== testVal.getValue()
      ) {
        return false
      }

      if (
        val instanceof LongVal &&
        testVal instanceof LongVal &&
        val.getValue() !== testVal.getValue()
      ) {
        return false
      }

      if (
        val instanceof NumberVal &&
        testVal instanceof NumberVal &&
        val.getValue() !== testVal.getValue()
      ) {
        return false
      }

      if (
        val instanceof ShortVal &&
        testVal instanceof ShortVal &&
        val.getValue() !== testVal.getValue()
      ) {
        return false
      }

      if (
        val instanceof StringVal &&
        testVal instanceof StringVal &&
        val.getValue() !== testVal.getValue()
      ) {
        return false
      }
      */
    }

    return true
  }
}
