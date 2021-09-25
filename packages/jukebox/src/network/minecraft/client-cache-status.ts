import { BinaryStream } from '@jukebox/binarystream'

import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeClientCacheStatus extends DataPacket {
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
