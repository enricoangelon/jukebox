import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeSetDifficulty extends DataPacket {
  public difficutlyLevel: number

  public constructor() {
    super(Protocol.SET_DIFFICULTY)
  }

  public encode(stream: WriteStream): void {
    stream.writeUnsignedVarInt(this.difficutlyLevel)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
