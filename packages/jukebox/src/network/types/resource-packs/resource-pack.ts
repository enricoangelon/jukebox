export interface ResourcePack {
  packID: string
  packVersion: string
  packSize: number
  encryptionKey: string
  subPackName: string
  contentID: string
  hasScripts: boolean
}
