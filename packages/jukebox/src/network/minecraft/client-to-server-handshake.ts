import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeClientToServerHandshake extends DataPacket {
  public constructor() {
    super(Protocol.CLIENT_TO_SERVER_HANDSHAKE)
  }

  public encode(): void {}

  public decode(): void {}
}
