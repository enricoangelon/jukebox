import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeNetworkSettings extends DataPacket {
  public compressionThreshold: number

  public constructor() {
    super(Protocol.NETWORK_SETTINGS)
  }

  public encode(stream: WriteStream): void {
    stream.writeShortLE(this.compressionThreshold)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
