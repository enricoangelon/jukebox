export interface LoginToken {
  extraData: { XUID: string; identity: string; displayName: string }
  identityPublicKey: string
  ClientRandomID: number
  ServerAddress: string
  LanguageCode: string
}
