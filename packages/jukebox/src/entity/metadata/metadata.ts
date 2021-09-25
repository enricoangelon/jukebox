export class Metadata<ReturnType> {
  private readonly typeId: number
  private readonly value: ReturnType

  public constructor(typeId: number, value: ReturnType) {
    this.typeId = typeId
    this.value = value
  }

  public getTypeId(): number {
    return this.typeId
  }

  public getValue(): ReturnType {
    return this.value
  }
}
