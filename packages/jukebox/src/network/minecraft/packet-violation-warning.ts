import { BinaryStream } from '@jukebox/binarystream'

import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpePacketViolationWarning extends DataPacket {
  public type: number
  public severity: number
  public packetId: number
  public context: string

  public constructor() {
    super(Protocol.PACKET_VIOLATION_WARNING)
  }

  public encode(): void {
    throw new Error('Unsupported operation')
  }

  public decode(stream: BinaryStream): void {
    this.type = stream.readVarInt()
    this.severity = stream.readVarInt()
    this.packetId = stream.readVarInt()
    this.context = McpeUtil.readString(stream)
  }
}
