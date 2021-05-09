import { NBTTag } from '../../../../nbt/lib/tag'

export interface BlockState {
  name: string
  nbt: NBTTag<number | string>
}
