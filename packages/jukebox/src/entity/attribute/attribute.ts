export class Attribute {
  private readonly minValue: number
  private readonly maxValue: number
  private readonly defaultValue: number
  private value: number

  public constructor(
    minValue: number,
    maxValue: number,
    defaultValue: number,
    value?: number
  ) {
    this.minValue = minValue
    this.maxValue = maxValue
    this.defaultValue = defaultValue
    this.value = value ?? defaultValue
  }

  // TODO: modifiers

  public getMinValue(): number {
    return this.minValue
  }

  public getMaxValue(): number {
    return this.maxValue
  }

  public getDefaultValue(): number {
    return this.defaultValue
  }

  public getValue(): number {
    return this.value
  }
}
