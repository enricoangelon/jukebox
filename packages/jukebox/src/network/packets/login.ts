import { Datagram } from '../protocol/datagram'
import { BinaryStream } from '@jukebox/binarystream'
import { PacketHandler } from '../packet-handler'
import * as jwt_decode from 'jwt-decode'
import { LoginToken } from '../types/login-token'

export class McpeLogin extends Datagram {
  public static readonly NETWORK_ID: number = 0x01

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
      let decodedChain = jwt_decode<LoginToken>(chainData.chain[i])

      if (decodedChain.extraData) {
        this.XUID = decodedChain.extraData.XUID
        this.identity = decodedChain.extraData.identity
        this.displayName = decodedChain.extraData.displayName
      }

      this.identityPublicKey = decodedChain.identityPublicKey
      // we have also certificateAuthority: true, maybe related to premium account or not, exp: integer, nbf: integers
    }

    let decodedJWT = jwt_decode<LoginToken>(
      buffer.get(buffer.getLInt()).toString()
    )
    this.clientRandomID = decodedJWT.ClientRandomID
    this.serverAddress = decodedJWT.ServerAddress
    this.languageCode = decodedJWT.LanguageCode
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleMcpeLogin(this)
  }
}
