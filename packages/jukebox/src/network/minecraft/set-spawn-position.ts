import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Vector3 } from '../../math/vector3'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeSetSpawnPosition extends DataPacket {
  public type: SpawnType
  public blockPosition: Vector3
  public dimension: number
  public spawnPosition: Vector3

  public constructor() {
    super(Protocol.SET_SPAWN_POSITION)
  }

  public encode(stream: WriteStream): void {
    stream.writeVarInt(this.type)
    McpeUtil.writeBlockCoords(stream, this.blockPosition)
    stream.writeVarInt(this.dimension)
    McpeUtil.writeBlockCoords(stream, this.spawnPosition)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}

export enum SpawnType {
  PLAYER,
  WORLD,
}
