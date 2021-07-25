// TODO: move these to skin classes
interface Image {
  ImageWidth: number
  ImageHeight: number
  Image: string
}

interface AnimatedImageData extends Image {
  Frames: number
  Type: number
  AnimationExpression: number
}

interface PersonaPiece {
  IsDefault: boolean
  PackId: string
  PieceId: string
  PieceType: string
  ProductId: string
}

interface PieceTintColor {
  Colors: Array<string>
  PieceType: string
}

export interface PlayerLoginData {
  // Player Info
  XUID: string
  identity: string
  displayName: string
  LanguageCode: string

  // Skin Info
  AnimatedImageData: Array<AnimatedImageData>
  ArmSize: string
  CapeData: string
  CapeId: string
  CapeImageHeight: number
  CapeImageWidth: number
  CapeOnClassicSkin: boolean
  PersonaPieces: Array<PersonaPiece>
  PersonaSkin: boolean
  PieceTintColors: Array<PieceTintColor>
  PlayFabId: string
  PremiumSkin: boolean
  SelfSignedId: string
  SkinAnimationData: string
  SkinColor: string
  SkinData: string
  SkinGeometryData: string
  SkinId: string
  SkinImageHeight: number
  SkinImageWidth: number
  SkinResourcePatch: string

  // Device Info
  DeviceId: string
  DeviceModel: string
  DeviceOS: number

  // Misc
  titleId: number
  ClientRandomId: number
  GuiScale: number
  DefaultInputMode: number
  CurrentInputMode: number
  GameVersion: string
  PlatformOfflineId: string
  PlatformOnlineId: string
  ThirdPartyName: string
  ThirdPartyNameOnly: boolean
  UIProfile: number
}
