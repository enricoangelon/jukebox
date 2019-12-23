import { Packet, IPacket } from '../packet'
import { RemoteInfo } from 'dgram'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../identifiers'

export class ConnectionRequestAccepted extends Packet implements IPacket {
  public static pid = Identifiers.ID_CONNECTION_REQUEST_ACCEPTED

  public systemAddresses = [{ ip: '127.0.0.1', port: 0, version: 4 }]

  public sendPingTime: number = -1
  public sendPongTime: number = -1
  constructor(
    rinfo: RemoteInfo,
    inputStream: BinaryStream,
    stream?: BinaryStream
  ) {
    super(rinfo, inputStream, stream)
  }

  encode() {
    this.stream.putByte(Identifiers.ID_CONNECTION_REQUEST_ACCEPTED) // forgot it... fuu

    this.stream.putAddress(this.rinfo.address, this.rinfo.port, 4)
    this.stream.putShort(0) //unknown

    //todo
    for (let i = 0; i < 20; i++) {
      if (typeof this.systemAddresses[i] === 'undefined') {
        this.stream.putAddress('0.0.0.0', 0, 4)
      } else {
        this.stream.putAddress(
          this.systemAddresses[i].ip,
          this.systemAddresses[i].port,
          this.systemAddresses[i].version
        )
      }
    }

    this.stream.putLong(this.sendPingTime)
    this.stream.putLong(this.sendPongTime)
  }
}
