import assert from 'assert'

import { PlayerLoginData } from '../../network/player-login-data'
import { SkinAnimation } from './animation'
import { SkinCape } from './cape'
import { SkinImage } from './image'
import { SkinPersona } from './persona'
import { SkinPersonaPiece } from './persona-piece'
import { SkinPersonaTintColors } from './tint-colors'

export class Skin {
  private identifier: string
  private resourcePatch: string
  private image: SkinImage
  private playFabId: string
  private animations: Array<SkinAnimation>
  private cape: SkinCape
  private color: string
  private geometry: string
  private armSize: string
  private persona: boolean
  private premium: boolean
  private animationData: string
  private capeOnClassicSkin: boolean
  private fullId: string
  private personaData: SkinPersona | null = null

  // TODO: skin editing functions

  public constructor(
    identifier: string,
    playFabId: string,
    resourcePatch: string,
    image: SkinImage,
    color: string,
    armSize: string,
    animations: Array<SkinAnimation>,
    cape: SkinCape,
    geometry: string,
    animationData: string,
    persona: boolean,
    premium: boolean,
    capeOnClassicSkin: boolean,
    personaData: SkinPersona | null = null
  ) {
    this.identifier = identifier
    this.resourcePatch = resourcePatch
    this.image = image
    this.playFabId = playFabId
    this.animations = animations
    this.cape = cape
    this.color = color
    this.geometry = geometry
    this.animationData = animationData
    this.armSize = armSize
    this.persona = persona
    this.premium = premium
    this.capeOnClassicSkin = capeOnClassicSkin
    this.personaData = personaData
    this.fullId = cape.getIndetifier() + identifier
  }

  public getIdentifier(): string {
    return this.identifier
  }

  public getResourcePatch(): string {
    return this.resourcePatch
  }

  public getImage(): SkinImage {
    return this.image
  }

  public getAnimations(): Array<SkinAnimation> {
    return this.animations
  }

  public getGeometry(): string {
    return this.geometry
  }

  public getAnimationData(): string {
    return this.animationData
  }

  public isPremium(): boolean {
    return this.premium
  }

  public isPersona(): boolean {
    return this.persona
  }

  public isCapeOnClassicSkin(): boolean {
    return this.capeOnClassicSkin
  }

  public getArmSize(): string {
    return this.armSize
  }

  public getColor(): string {
    return this.color
  }

  public getFullId(): string {
    return this.fullId
  }

  public getCape(): SkinCape {
    return this.cape
  }

  public getPersonaData(): SkinPersona {
    assert(this.personaData != null, 'Persona skin data is null')
    return this.personaData
  }

  public getPlayFabId(): string {
    return this.playFabId
  }

  public static fromJWT(loginData: PlayerLoginData) {
    return new Skin(
      loginData.SkinId,
      loginData.PlayFabId,
      JSON.stringify(
        JSON.parse(
          Buffer.from(loginData.SkinResourcePatch, 'base64').toString()
        )
      ),
      new SkinImage(
        loginData.SkinImageWidth,
        loginData.SkinImageHeight,
        Buffer.from(loginData.SkinData, 'base64')
      ),
      loginData.SkinColor,
      loginData.ArmSize,
      loginData.AnimatedImageData.map(
        animatedImageData =>
          new SkinAnimation(
            new SkinImage(
              animatedImageData.ImageWidth,
              animatedImageData.ImageHeight,
              Buffer.from(animatedImageData.Image, 'base64')
            ),
            animatedImageData.Frames,
            animatedImageData.Type,
            animatedImageData.AnimationExpression
          )
      ),
      new SkinCape(
        loginData.CapeId,
        new SkinImage(
          loginData.CapeImageWidth,
          loginData.CapeImageHeight,
          Buffer.from(loginData.CapeData, 'base64')
        )
      ),
      JSON.stringify(
        JSON.parse(Buffer.from(loginData.SkinGeometryData, 'base64').toString())
      ),
      Buffer.from(loginData.SkinAnimationData, 'base64').toString(),
      loginData.PersonaSkin,
      loginData.PremiumSkin,
      loginData.CapeOnClassicSkin,
      loginData.PersonaSkin
        ? new SkinPersona(
            loginData.PersonaPieces.map(
              personaPiece =>
                new SkinPersonaPiece(
                  personaPiece.IsDefault,
                  personaPiece.PackId,
                  personaPiece.PieceId,
                  personaPiece.PieceType,
                  personaPiece.ProductId
                )
            ),
            loginData.PieceTintColors.map(
              tintColor =>
                new SkinPersonaTintColors(tintColor.Colors, tintColor.PieceType)
            )
          )
        : null
    )
  }
}
