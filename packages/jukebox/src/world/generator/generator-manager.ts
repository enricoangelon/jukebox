import { Flat } from './flat'
import { Generator, WorldGenerator } from './generator'

export class GeneratorManager {
  private static generators: Map<string, WorldGenerator> = new Map()

  public static init(): void {
    this.registerGenerator('flat', Generator.FLAT, Flat)
  }

  public static registerGenerator(name: string, type: number, generator: any) {
    this.generators.set(name, new generator(type))
  }

  public static getGenerator(name: string): WorldGenerator {
    if (!this.generators.has(name)) {
      throw new Error(`World generator ${name} not found!`)
    }
    return this.generators.get(name)!
  }
}
