import { DataPacket } from './internal/data-packet'
import { Protocol } from '../protocol'

export class ClientToServerHandshake extends DataPacket {
  public constructor() {
    super(Protocol.CLIENT_TO_SERVER_HANDSHAKE)
  }

  public encode(): void {}

  public decode(): void {}
}
