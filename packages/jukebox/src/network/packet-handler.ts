import { RemoteInfo } from 'dgram'
import { Batched } from './protocol/batched'
import { Encapsulated } from '@jukebox/raknet'
import { Datagram } from './protocol/datagram'
import { Jukebox } from '../jukebox'

export class PacketHandler {
  public handleBatched(rinfo: RemoteInfo, packet: Encapsulated) {
    let batched = new Batched()
    batched.setBuffer(packet.getBuffer())
    batched.decode()
    batched.handle(rinfo, this)
  }

  public handleDatagram(rinfo: RemoteInfo, packet: Datagram) {
    Jukebox.getLogger().debug(`GOT ${packet.getName()}`)
  }
}
