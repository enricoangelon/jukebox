import { BinaryStream } from '@jukebox/binarystream'
import { NetUtils } from '../../net-utils'
import { Packet } from '../../packet'
import { RemoteInfo } from 'dgram'
import { Identifiers } from '../../identifiers'

export class NewIncomingConnection extends Packet {
  public serverAddress: RemoteInfo
  public systemAddress: Array<RemoteInfo> = []
  public clientTimestamp: bigint
  public timestamp: bigint

  public constructor() {
    super(Identifiers.NEW_INCOMING_CONNECTION)
  }

  public encode(stream: BinaryStream): void {
    NetUtils.writeAddress(stream, this.serverAddress)
    for (let i = 0; i < 20; i++) {
      NetUtils.writeAddress(stream, <RemoteInfo>{
        address: '255.255.255.255',
        port: 19132,
        family: 'IPv4',
      })
    }
    stream.writeLong(this.clientTimestamp)
    stream.writeLong(this.timestamp)
  }

  public decode(stream: BinaryStream): void {
    this.serverAddress = NetUtils.readAddress(stream)
    for (let i = 0; i < 20; i++) {
      this.systemAddress.push(NetUtils.readAddress(stream))
    }
    this.clientTimestamp = stream.readLong()
    this.timestamp = stream.readLong()
  }
}
