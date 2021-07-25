import { SkinImage } from './image'

export class SkinCape {
  private identifier: string
  private image: SkinImage

  public constructor(identifier: string, image: SkinImage) {
    this.identifier = identifier
    this.image = image
  }

  public getIndetifier(): string {
    return this.identifier
  }

  public getImage(): SkinImage {
    return this.image
  }
}
