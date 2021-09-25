import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Vector3 } from '../../math/vector3'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeNetworkChunkPublisherUpdate extends DataPacket {
  public position: Vector3
  public radius: number

  public constructor() {
    super(Protocol.NETWORK_CHUNK_PUBLISHER_UPDATE)
  }

  public encode(stream: WriteStream): void {
    McpeUtil.writeBlockCoords(stream, this.position)
    stream.writeUnsignedVarInt(this.radius)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
