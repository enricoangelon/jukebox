import { BinaryStream } from '@jukebox/binarystream'

import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeResourcePackResponse extends DataPacket {
  public status: number
  // Array of pack UUIDs the client will download
  public packIds: Array<string> = []

  public constructor() {
    super(Protocol.RESOURCE_PACK_RESPONSE)
  }

  public encode(): void {
    throw new Error('Unsupported operation')
  }

  public decode(stream: BinaryStream): void {
    this.status = stream.readByte()
    const length = stream.readUnsignedShortLE()
    for (let i = 0; i < length; i++) {
      this.packIds.push(McpeUtil.readString(stream))
    }
  }
}

// https://wiki.vg/Bedrock_Protocol#Resource_Pack_Client_Response
export enum ResourcePackResponse {
  REFUSED = 1,
  SEND_PACKS,
  HAVE_ALL_PACKS,
  COMPLETED,
}
