import { IPlayer } from './player-interface'
import { PacketHandler } from './network/packet-handler'

export class Player implements IPlayer {
  public packetHandler: PacketHandler = new PacketHandler() // init autonomous packet handler per player
}
