import { Socket, RakNetSession } from '@jukebox/raknet'
import { Batched } from '../../lib/network/protocol/batched'
import { RemoteInfo } from 'dgram'

export class RakNetInstancer {
  public socket = new Socket() // initialize server main socket

  // Any used because Datagram is already used in batched and is cyclic :'(
  public static sendDataPacket(packet: Batched | any, rinfo: RemoteInfo) {
    if (packet instanceof Batched) {
      RakNetSession.sendDgramPacket(packet, rinfo)
    } else {
      let pk = new Batched()
      pk.addPacket(packet)
      RakNetInstancer.sendDataPacket(pk, rinfo)
    }
  }
}
