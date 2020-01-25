import { Socket } from '@jukebox/raknet'
import { Datagram } from './protocol/datagram'

export class RakNetInstancer {
  public socket = new Socket()

  public static sendPacket(packet: Datagram) {}
}
