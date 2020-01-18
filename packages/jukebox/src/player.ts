import { IPlayer } from './player-interface'
import { PacketHandler } from './network/packet-handler'
import { McpePlayStatus } from './network/packets/mcpe-play-status'
import { Socket } from '@jukebox/raknet'
import { RemoteInfo } from 'dgram'

export class Player implements IPlayer {
  public packetHandler: PacketHandler = new PacketHandler(this) // init autonomous packet handler per player
  public rinfo: RemoteInfo

  public XUID: string | undefined
  public UUID: string | undefined
  public username: string | undefined
  public protocol: string | undefined

  constructor(rinfo: RemoteInfo) {
    this.rinfo = rinfo
  }

  public processJoin() {
    // send play status
    let pk = new McpePlayStatus()
    pk.status = 0 // login success
    pk.encode()
    Socket.sendBuffer(pk.getBuffer(), this.rinfo.port, this.rinfo.address)
  }
}
