import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpePlayStatus extends DataPacket {
  public status: number

  public constructor() {
    super(Protocol.PLAY_STATUS)
  }

  public encode(stream: WriteStream): void {
    stream.writeInt(this.status)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}

// NOTE: https://wiki.vg/Bedrock_Protocol#Play%20Status
export enum PlayStatus {
  LOGIN_SUCCESS,
  FAILED_CLIENT_OUTDATED,
  FAILED_SERVER_OUTDATED,
  PLAYER_SPAWN,
  FAILED_INVALID_TENANT,
  FAILED_VANILLA_EDU,
  FAILED_EDU_VANILLA,
  FAILED_SERVER_FULL,
}
