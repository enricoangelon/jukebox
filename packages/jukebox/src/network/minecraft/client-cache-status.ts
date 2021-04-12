import { BinaryStream } from '@jukebox/binarystream'
import { DataPacket } from './internal/data-packet'
import { Protocol } from '../protocol'

export class ClientCacheStatus extends DataPacket {
  public supported: boolean

  public constructor() {
    super(Protocol.CLIENT_CACHE_STATUS)
  }

  public encode(): void {
    throw new Error('Unsupported operation')
  }

  public decode(stream: BinaryStream): void {
    this.supported = stream.readBoolean()
  }
}
