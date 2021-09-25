import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeServerToClientHandshake extends DataPacket {
  public jwtToken: string

  public constructor() {
    super(Protocol.SERVER_TO_CLIENT_HANDSHAKE)
  }

  public encode(stream: WriteStream): void {
    McpeUtil.writeString(stream, this.jwtToken)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
