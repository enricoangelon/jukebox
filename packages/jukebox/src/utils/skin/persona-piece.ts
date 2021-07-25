export class SkinPersonaPiece {
  public default: boolean
  public packId: string
  public pieceId: string
  public pieceType: string
  public productId: string

  public constructor(
    def: boolean,
    packId: string,
    pieceId: string,
    pieceType: string,
    productId: string
  ) {
    this.default = def
    this.packId = packId
    this.pieceId = pieceId
    this.pieceType = pieceType
    this.productId = productId
  }
}
