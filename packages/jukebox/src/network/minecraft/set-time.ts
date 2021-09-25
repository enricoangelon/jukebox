import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeSetTime extends DataPacket {
  public time: number

  public constructor() {
    super(Protocol.SET_TIME)
  }

  public encode(stream: WriteStream): void {
    stream.writeVarInt(this.time)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
