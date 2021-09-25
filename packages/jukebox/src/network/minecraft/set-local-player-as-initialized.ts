import { BinaryStream } from '@jukebox/binarystream'

import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeSetLocalPlayerAsInitialized extends DataPacket {
  public runtimeEntityId: bigint

  public constructor() {
    super(Protocol.SET_LOCAL_PLAYER_AS_INITIALIZED)
  }

  public encode(): void {
    throw new Error('Unsupported operation')
  }

  public decode(stream: BinaryStream): void {
    this.runtimeEntityId = stream.readUnsignedVarLong()
  }
}
