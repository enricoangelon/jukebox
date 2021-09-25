import { RemoteInfo } from 'dgram'

import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Identifiers } from '../../identifiers'
import { NetUtils } from '../../net-utils'
import { Packet } from '../../packet'

export class ConnectionRequestAccepted extends Packet {
  public clientAddress: RemoteInfo
  public clientTimestamp: bigint
  public timestamp: bigint

  public constructor() {
    super(Identifiers.CONNECTION_REQUEST_ACCEPTED)
  }

  public encode(stream: WriteStream): void {
    NetUtils.writeAddress(stream, this.clientAddress)
    stream.writeShort(0) // unknown
    for (let i = 0; i < 20; i++) {
      NetUtils.writeAddress(stream, this.clientAddress)
    }
    stream.writeLong(this.clientTimestamp)
    stream.writeLong(this.timestamp)
  }

  public decode(stream: BinaryStream): void {
    this.clientAddress = NetUtils.readAddress(stream)
    stream.readShort() // unknown
    for (let i = 0; i < 20; i++) {
      NetUtils.readAddress(stream)
    }
    this.clientTimestamp = stream.readLong()
    this.timestamp = stream.readLong()
  }
}
