// https://github.com/NiclasOlofsson/MiNET/blob/2c70bcfb15a4118db9c3cc826dfb44bfee5cd5fb/src/MiNET/MiNET/Utils/BlockPalette.cs#L34
// Very clear docs :)

import { BlockState } from './block-state'

export interface BlockStateContainer {
  name: string
  legacyId: number
  runtimeId: number
  states: Set<BlockState>
  meta: number
}
