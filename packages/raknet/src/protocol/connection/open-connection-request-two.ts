import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../../identifiers'
import { NetUtils } from '../../net-utils'
import { Packet } from '../../packet'
import { RemoteInfo } from 'dgram'

export class OpenConnectionRequestTwo extends Packet {
  public magic: Buffer
  public serverAddress: RemoteInfo
  public maximumTransferUnit: number
  public clientGuid: bigint

  public constructor() {
    super(Identifiers.OPEN_CONNECTION_REQUEST_2)
  }

  public encode(stream: BinaryStream): void {
    NetUtils.writeMagic(stream)
    NetUtils.writeAddress(stream, this.serverAddress)
    stream.writeUnsignedShort(this.maximumTransferUnit)
    stream.writeLong(this.clientGuid)
  }

  public decode(stream: BinaryStream): void {
    this.magic = NetUtils.readMagic(stream)
    this.serverAddress = NetUtils.readAddress(stream)
    this.maximumTransferUnit = stream.readUnsignedShort()
    this.clientGuid = stream.readLong()
  }
}
