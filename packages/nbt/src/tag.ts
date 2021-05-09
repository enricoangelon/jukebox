export class NBTTag<Type> {
  private type: number
  private value: Type

  public constructor(type: number, value: Type) {
    this.type = type // NBTDefinitions[type]
    this.value = value
  }

  public getTagType(): number {
    return this.type
  }

  public get(): Type {
    return this.value
  }
}
