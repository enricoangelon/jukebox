import { SkinImage } from './image'

export class SkinAnimation {
  private image: SkinImage
  private frames: number
  private type: number
  private expression: number

  // TODO: shrink the constructor
  public constructor(
    image: SkinImage,
    frames: number,
    type: number,
    expression: number
  ) {
    this.image = image
    this.frames = frames
    this.type = type
    this.expression = expression
  }

  public setImage(image: SkinImage): void {
    this.image = image
  }

  public getImage(): SkinImage {
    return this.image
  }

  public setFrames(frames: number): void {
    this.frames = frames
  }

  public getFrames(): number {
    return this.frames
  }

  public setType(type: number): void {
    this.type = type
  }

  public getType(): number {
    return this.type
  }

  // TODO: enum if possible
  public setExpression(expression: number): void {
    this.expression = expression
  }

  public getExpression(): number {
    return this.expression
  }
}
