import { ResourceManager } from '../resources/resource-manager'
import { inspect } from 'util'

export class BlockManager {
  private static legacyToRuntimeId: Map<number, number> = new Map()

  public static init(): void {
    this.generateMappings()
  }

  private static generateMappings(): void {
    const blockStates = ResourceManager.computeBlockStates()
    for (const stateContainer of blockStates) {
      if (stateContainer.meta > 15) continue // No one knows why we have meta bigger than 15
      if (stateContainer.name == 'minecraft:stone') {
        // console.log(inspect(stateContainer, { depth: null, showHidden: true }))
      }
      this.legacyToRuntimeId.set(
        (stateContainer.legacyId << 4) | stateContainer.meta,
        stateContainer.runtimeId
      )
    }
  }

  // TODO: legacyIds & metadata are no longer used, convert to namespaces...
  public static getRuntimeId(legacyId: number, meta: number): number {
    return this.legacyToRuntimeId.get((legacyId << 4) | meta)!
  }
}
