import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../../identifiers'
import { NetUtils } from '../../net-utils'
import { Packet } from '../../packet'

export class OpenConnectionReplyOne extends Packet {
  public magic: Buffer
  public serverGuid: bigint
  // Security is not supported
  public security = false
  public maximumTransferUnit: number

  public constructor() {
    super(Identifiers.OPEN_CONNECTION_REPLY_1)
  }

  public encode(stream: BinaryStream): void {
    NetUtils.writeMagic(stream)
    stream.writeLong(this.serverGuid)
    stream.writeBoolean(this.security)
    stream.writeUnsignedShort(this.maximumTransferUnit)
  }

  public decode(stream: BinaryStream): void {
    this.magic = NetUtils.readMagic(stream)
    this.serverGuid = stream.readLong()
    this.security = stream.readBoolean()
    this.maximumTransferUnit = stream.readUnsignedShort()
  }
}
