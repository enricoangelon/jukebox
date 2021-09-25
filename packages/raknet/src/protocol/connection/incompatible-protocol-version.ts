import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { NetUtils } from '../..'
import { Identifiers } from '../../identifiers'
import { Packet } from '../../packet'

export class IncompatibleProtocolVersion extends Packet {
  public serverProtocol: number
  public serverGUID: bigint

  public constructor() {
    super(Identifiers.INCOMPATIBLE_PROTOCOL_VERSION)
  }

  public encode(stream: WriteStream): void {
    stream.writeByte(this.serverProtocol)
    NetUtils.writeMagic(stream)
    stream.writeLong(this.serverGUID)
  }

  public decode(stream: BinaryStream): void {
    this.serverProtocol = stream.readByte()
    NetUtils.readMagic(stream)
    this.serverGUID = stream.readLong()
  }
}
