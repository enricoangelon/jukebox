import { BlockStateContainer } from './internal/block-state-container'
import { ResourceManager } from '../resources/resource-manager'
import assert from 'assert'

export class BlockManager {
  private static legacyToRuntimeId: Map<number, number> = new Map()
  private static runtimeToLegacyId: Map<number, number> = new Map()
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
      this.legacyToRuntimeId.set(
        (stateContainer.legacyId << 4) | stateContainer.meta,
        stateContainer.runtimeId
      )
      this.runtimeToLegacyId.set(
        stateContainer.runtimeId,
        (stateContainer.legacyId << 4) | stateContainer.meta
      )
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

  public static getRuntimeByLegacyId(legacyId: number, meta: number): number {
    return (
      this.legacyToRuntimeId.get((legacyId << 4) | meta) ??
      this.getRuntimeId('minecraft:air')
    )
  }
}
