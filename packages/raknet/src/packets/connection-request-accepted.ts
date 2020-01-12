import { Packet, IPacket } from '../protocol/packet'
import { Identifiers } from '../protocol/identifiers'
import { Jukebox } from '@jukebox/core'

export class ConnectionRequestAccepted extends Packet implements IPacket {
  public static pid = Identifiers.ID_CONNECTION_REQUEST_ACCEPTED

  public sendPingTime: number = -1
  public sendPongTime: number = -1

  public encode() {
    this.stream.putByte(Identifiers.ID_CONNECTION_REQUEST_ACCEPTED)

    this.stream.putAddress(this.rinfo.address, this.rinfo.port, 4)
    this.stream.putShort(0) //unknown

    /* 
    not documented, this will be tested soon when we will be able to make a proxy with the software
    so with that proxy we can maybe reverse engeener packets... atm is good like that! 
    */
    const { systemAddresses } = Jukebox.getConfig().server
    for (let i = 0; i < 20; ++i) {
      let addr =
        typeof systemAddresses !== 'undefined'
          ? systemAddresses[i]
          : ['0.0.0.0', 0, 4]
      this.stream.putAddress(
        addr[0].toString(),
        Number(addr[1]),
        Number(addr[2])
      )
    }

    this.stream.putLong(this.sendPingTime)
    this.stream.putLong(this.sendPongTime)
  }
}
