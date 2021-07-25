import { SkinPersonaPiece } from './persona-piece'
import { SkinPersonaTintColors } from './tint-colors'

export class SkinPersona {
  private pieces: Array<SkinPersonaPiece>
  private tintColors: Array<SkinPersonaTintColors>

  public constructor(
    pieces: Array<SkinPersonaPiece>,
    tintColors: Array<SkinPersonaTintColors>
  ) {
    this.pieces = pieces
    this.tintColors = tintColors
  }

  public getPieces(): Array<SkinPersonaPiece> {
    return this.pieces
  }

  public getTintColors(): Array<SkinPersonaTintColors> {
    return this.tintColors
  }
}
