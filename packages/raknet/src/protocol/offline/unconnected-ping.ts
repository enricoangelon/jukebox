import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Identifiers } from '../../identifiers'
import { NetUtils } from '../../net-utils'
import { Packet } from '../../packet'

export class UnconnectedPing extends Packet {
  public timestamp: bigint
  public magic: Buffer

  public constructor(openConnections = false) {
    super(
      openConnections
        ? Identifiers.UNCONNECTED_PING_OPEN_CONNECTION
        : Identifiers.UNCONNECTED_PING
    )
  }

  public encode(stream: WriteStream): void {
    stream.writeLong(this.timestamp)
    NetUtils.writeMagic(stream)
  }

  public decode(stream: BinaryStream): void {
    this.timestamp = stream.readLong()
    this.magic = NetUtils.readMagic(stream)
  }
}
