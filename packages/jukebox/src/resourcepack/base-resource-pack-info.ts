import { BasePackInfo } from './base-pack-info'

export interface BaseResourcePackInfo extends BasePackInfo {
  size: bigint
  contentKey: string
  contentIdentity: string
  hasScripts: boolean
}
