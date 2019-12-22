import { Packet, IPacket } from '../packet'
import { RemoteInfo } from 'dgram'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../identifiers'

export class ConnectionRequestAccepted extends Packet implements IPacket {
  public static pid = Identifiers.ID_CONNECTION_REQUEST_ACCEPTED

  public systemAddresses: [string, number, number] = ['0.0.0.0', 0, 4]

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
    this.stream.putAddress(this.rinfo.address, this.rinfo.port)
    this.stream.putShort(0) //unknown

    //todo
    for (let i = 0; i < 20; i++) {
      // if (typeof this.systemAddresses[i] === "undefined") {
      this.stream.putAddress('0.0.0.0', 0, 4)
      //  }else{
      //  this.stream.putAddress(this.systemAddresses[0])
      // }
    }

    this.stream.putLong(this.sendPingTime)
    this.stream.putLong(this.sendPongTime)
  }
}
