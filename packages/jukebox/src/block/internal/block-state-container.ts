import { BlockState } from './block-state'

export interface BlockStateContainer {
  name: string
  legacyId: number
  meta: number
  runtimeId: number
  states: Set<BlockState>
}
