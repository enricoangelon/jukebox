import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../../identifiers'
import { NetUtils } from '../../net-utils'
import { Packet } from '../../packet'
import { RemoteInfo } from 'dgram'

export class OpenConnectionReplyTwo extends Packet {
  public magic: Buffer
  public serverGuid: bigint
  public clientAddress: RemoteInfo
  public maximumTransferUnit: number
  public encryption = false

  public constructor() {
    super(Identifiers.OPEN_CONNECTION_REPLY_2)
  }

  public encode(stream: BinaryStream): void {
    NetUtils.writeMagic(stream)
    stream.writeLong(this.serverGuid)
    NetUtils.writeAddress(stream, this.clientAddress)
    stream.writeUnsignedShort(this.maximumTransferUnit)
    stream.writeBoolean(this.encryption)
  }

  public decode(stream: BinaryStream): void {
    this.magic = NetUtils.readMagic(stream)
    this.serverGuid = stream.readLong()
    this.clientAddress = NetUtils.readAddress(stream)
    this.maximumTransferUnit = stream.readUnsignedShort()
    this.encryption = stream.readBoolean()
  }
}
