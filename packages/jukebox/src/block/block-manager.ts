import assert from 'assert'

import { ResourceManager } from '../resources/resource-manager'
import { BlockStateContainer } from './internal/block-state-container'

export class BlockManager {
  private static blockStateMappings: Map<
    string,
    BlockStateContainer
  > = new Map()

  public static init(): void {
    this.generateMappings()
  }

  private static generateMappings(): void {
    const blockStates = ResourceManager.computeBlockStates()
    for (const stateContainer of blockStates) {
      this.blockStateMappings.set(stateContainer.name, stateContainer)
    }
  }

  // TODO: find a way to get the right state
  public static getRuntimeId(blockName: string): number {
    assert(
      blockName.startsWith('minecraft:'),
      'Block name must start with "minecraft:"!'
    )
    if (!this.blockStateMappings.has(blockName)) {
      const state = this.blockStateMappings.get('minecraft:air')
      // Air can't be missing!!
      assert(state != null, 'Bad block state mappings!')
      return state.runtimeId
    }
    const state = this.blockStateMappings.get(blockName)!
    return state.runtimeId
  }
}
