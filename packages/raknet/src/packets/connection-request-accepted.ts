import { Packet, IPacket } from '../protocol/packet'
import { Identifiers } from '../protocol/identifiers'
import { Jukebox } from '@jukebox/core'
import { RakNetSession } from '../session'
import { InternetAddress } from '../protocol/internet-address'
import { Utils } from '@jukebox/binarystream'

export class ConnectionRequestAccepted extends Packet implements IPacket {
  public static pid = Identifiers.ID_CONNECTION_REQUEST_ACCEPTED

  public sendPingTime: number = this.inputStream.getLong()
  public sendPongTime: number = RakNetSession.getStartTime()

  private systemAddresses: InternetAddress[] = [
    new InternetAddress('127.0.0.1', 0, 4),
  ]

  public encode() {
    this.stream.putByte(Identifiers.ID_CONNECTION_REQUEST_ACCEPTED)

    this.stream.putAddress(this.rinfo.address, this.rinfo.port, 4)
    this.stream.putShort(0) //unknown

    let configAddresses = Jukebox.getConfig().server.systemAddresses
      ? Jukebox.getConfig().server.systemAddresses
      : undefined
    if (typeof configAddresses !== 'undefined' && configAddresses.length > 0) {
      for (let i = 0; i < configAddresses.length; i++) {
        this.systemAddresses.push(configAddresses[i])
      }
    }

    /* 
    not documented, this will be tested soon when we will be able to make a proxy with the software
    so with that proxy we can maybe reverse engeener packets... atm is good like that! 
    */
    for (let i = 0; i < Utils.system_address_count; i++) {
      let addr =
        typeof this.systemAddresses[i] !== 'undefined'
          ? this.systemAddresses[i]
          : new InternetAddress('0.0.0.0', 0, 4)
      this.stream.putAddress(addr.address, addr.port, addr.version)
    }

    this.stream.putLong(this.sendPingTime)
    this.stream.putLong(this.sendPongTime)
  }
}
