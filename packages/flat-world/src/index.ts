import { WorldGenerator } from '@jukebox/core'

export class FlatWorld implements WorldGenerator {
  public getName(): string {
    return 'world'
  }
}
