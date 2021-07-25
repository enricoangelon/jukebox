import { BlockState } from './block-state'

export interface BlockStateContainer {
  name: string
  runtimeId: number
  states: Set<BlockState>
}
