import { Batched } from './protocol/batched'
import { Datagram } from './protocol/datagram'
import { Jukebox } from '../jukebox'
import { Player } from '../player'
import { McpeLogin } from './packets/mcpe-login'
import { McpePlayStatus } from './packets/mcpe-play-status'
import { McpeResourcePacksInfo } from './packets/mcpe-resource-packs-info'

export class PacketHandler {
  private player: Player
  constructor(owner: Player) {
    this.player = owner
  }
  // internals
  public handleBatched(packet: Buffer) {
    Jukebox.getLogger().debug(`Handling batched`)

    let pk = new Batched(packet)
    pk.decode()
    pk.handle(this)
  }

  public handleDatagram(packet: Datagram) {
    Jukebox.getLogger().debug(`Handling now: ${packet.getName()}`)

    packet.decode()

    if (!packet.feof() && !packet.mayHaveUnreadBytes) {
      let remains = packet.getBuffer().slice(packet.offset)
      Jukebox.getLogger().warn(
        `Still ${
          remains.length
        } unread bytes in ${packet.getName()}: 0x${remains.toString('hex')}`
      )
    }

    packet.handle(this)
    // todo: make automaitc handle system like this[`handle${packet.getName()}`](packet)
  }

  // player packets
  public handleMcpeLogin(packet: McpeLogin) {
    this.player.XUID = packet.XUID
    this.player.UUID = packet.identity
    this.player.username = packet.displayName
    this.player.processJoin()
    return true
  }

  public handleMcpePlayStatus(packet: McpePlayStatus) {
    return false
  }

  public handleResourcePacksInfo(packet: McpeResourcePacksInfo) {
    return false
  }
}
