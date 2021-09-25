import { BinaryStream } from '@jukebox/binarystream'

import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeLogin extends DataPacket {
  public gameProtocol: number
  public chainData: string
  public skinData: string

  public constructor() {
    super(Protocol.LOGIN)
  }

  public encode(): void {
    throw new Error('Unsupported operation')
  }

  public decode(stream: BinaryStream): void {
    this.gameProtocol = stream.readInt()

    const bodyLength = stream.readUnsignedVarInt()
    const bodyStream = new BinaryStream(stream.read(bodyLength))

    this.chainData = McpeUtil.readLELengthASCIIString(bodyStream)
    this.skinData = McpeUtil.readLELengthASCIIString(bodyStream)
  }
}
