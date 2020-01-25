import { IPlayer } from './player-interface'
import { PacketHandler } from './network/packet-handler'
import { McpePlayStatus } from './network/packets/mcpe-play-status'
import { Socket } from '@jukebox/raknet'
import { RemoteInfo } from 'dgram'
import { McpeResourcePacksInfo } from './network/packets/mcpe-resource-packs-info'
import { PlayStates } from './network/types/play-states'
import { Batched } from './network/protocol/batched'
import { Jukebox } from './jukebox'

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
    let pk, batched
    pk = new McpePlayStatus()
    pk.status = PlayStates.LOGIN_SUCCESS // login success
    pk.encode()
    batched = new Batched()
    batched.addPacket(pk)
    batched.encode()
    Jukebox.sendPacket(batched, this.rinfo)

    // attempt 2
    pk = new McpePlayStatus()
    pk.status = PlayStates.LOGIN_SUCCESS // login success
    batched = new Batched(pk.getBuffer())
    batched.encode()
    Socket.sendBuffer(batched.getBuffer(), this.rinfo.port, this.rinfo.address)

    // resource packs info [temporary data]
    // this packet is not fully documented yet
    pk = new McpeResourcePacksInfo()
    pk.resourcePackList = []
    pk.isRequired = false
    pk.encode()
    batched = new Batched()
    batched.addPacket(pk)
    batched.encode()
    Jukebox.sendPacket(batched, this.rinfo)

    // attempt 2
    pk = new McpeResourcePacksInfo()
    pk.resourcePackList = []
    pk.isRequired = false
    pk.encode()
    batched = new Batched(pk.getBuffer())
    batched.encode()
    Socket.sendBuffer(batched.getBuffer(), this.rinfo.port, this.rinfo.address)
  }
}
