import { BinaryStream } from '@jukebox/binarystream'
import { DataPacket } from './internal/data-packet'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'

export class McpeServerToClientHandshake extends DataPacket {
  public jwtToken: string

  public constructor() {
    super(Protocol.SERVER_TO_CLIENT_HANDSHAKE)
  }

  public encode(stream: BinaryStream): void {
    McpeUtil.writeString(stream, this.jwtToken)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
