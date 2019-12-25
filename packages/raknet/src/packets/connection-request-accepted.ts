import { Packet, IPacket } from '../packet'
import { RemoteInfo } from 'dgram'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../identifiers'

export class ConnectionRequestAccepted extends Packet implements IPacket {
  public static pid = Identifiers.ID_CONNECTION_REQUEST_ACCEPTED

  public systemAddresses = [['127.0.0.1', 0, 4]]

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

    for (let i = 0; i < 20; ++i) {
      let addr =
        typeof this.systemAddresses[i] !== 'undefined'
          ? this.systemAddresses[i]
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
