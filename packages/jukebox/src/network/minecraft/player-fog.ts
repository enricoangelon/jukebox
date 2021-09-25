import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpePlayerFog extends DataPacket {
  public fogStack: Array<string>

  public constructor() {
    super(Protocol.PLAYER_FOG)
  }

  public encode(stream: WriteStream): void {
    stream.writeUnsignedVarInt(this.fogStack.length)
    for (const fogLayer of this.fogStack) {
      McpeUtil.writeString(stream, fogLayer)
    }
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
