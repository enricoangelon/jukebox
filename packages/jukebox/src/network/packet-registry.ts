import { McpeLogin } from './minecraft/login'
import { Protocol } from './protocol'
import assert from 'assert'

// TODO: fix typings
export class PacketRegistry {
  public static readonly packets: Map<number, any> = new Map()

  public static init() {
    PacketRegistry.packets.set(Protocol.LOGIN, McpeLogin)
  }

  public static getPacketByID(id: number): any {
    assert(PacketRegistry.packets.has(id), 'Packet not found in registry!')
    return PacketRegistry.packets.get(id)!
  }
}
