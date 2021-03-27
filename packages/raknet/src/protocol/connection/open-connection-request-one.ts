import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../../identifiers'
import { NetUtils } from '../../net-utils'
import { Packet } from '../../packet'

export class OpenConnectionRequestOne extends Packet {
  public magic: Buffer
  // RakNet protocol version identifier
  public remoteProtocol: number
  public maximumTransferUnit: number

  public constructor() {
    super(Identifiers.OPEN_CONNECTION_REQUEST_1)
  }

  public encode(stream: BinaryStream): void {
    NetUtils.writeMagic(stream)
    stream.writeByte(this.remoteProtocol)
    const length = this.maximumTransferUnit - stream.getBuffer().byteLength + 28
    stream.write(Buffer.alloc(length).fill(0x00))
  }

  public decode(stream: BinaryStream): void {
    this.magic = NetUtils.readMagic(stream)
    this.remoteProtocol = stream.readByte()
    this.maximumTransferUnit = stream.getRemaining().byteLength + 46
  }
}
