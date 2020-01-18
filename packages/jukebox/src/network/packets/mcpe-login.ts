import { Datagram } from '../protocol/datagram'
import { BinaryStream } from '@jukebox/binarystream'
import { JWT } from '../utils/jwt'
import { PacketHandler } from '../packet-handler'

export class McpeLogin extends Datagram {
  public pid: number = 0x01
  public static pid: number = 0x01

  // decoded values
  public XUID: string | undefined
  public identity: string | undefined
  public displayName: string | undefined
  public protocol: number | undefined
  public identityPublicKey: string | undefined

  public clientRandomID: number | undefined
  public serverAddress: string | undefined
  public languageCode: string | undefined

  // packet stuff
  public allowBeforeLogin: boolean = true
  public mayHaveUnreadBytes: boolean = this.protocol !== 389 // take it from a static posititon

  public decodePayload() {
    this.protocol = this.getInt()

    let buffer = new BinaryStream(this.get(this.getUnsignedVarInt())) // this returns string in binary
    let chainData = JSON.parse(buffer.get(buffer.getLInt()).toString())

    for (let i = 0; i < chainData.chain.length; i++) {
      let decodedChain = JWT.decodeJWT(chainData.chain[i])

      if (decodedChain.extraData) {
        this.XUID = decodedChain.extraData.XUID
        this.identity = decodedChain.extraData.identity
        this.displayName = decodedChain.extraData.displayName
      }

      this.identityPublicKey = decodedChain.identityPublicKey
      // we have also certificateAuthority: true, maybe related to premium account or not, exp: integer, nbf: integers
    }

    let decodedJWT = JWT.decodeJWT(buffer.get(buffer.getLInt()).toString())
    this.clientRandomID = decodedJWT.ClientRandomID
    this.serverAddress = decodedJWT.ServerAddress
    this.languageCode = decodedJWT.LanguageCode
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleMcpeLogin(this)
  }
}
