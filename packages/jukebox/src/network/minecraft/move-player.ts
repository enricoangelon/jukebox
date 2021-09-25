import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Vector3 } from '../../math/vector3'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeMovePlayer extends DataPacket {
  public runtimeEntityId: bigint
  public position: Vector3
  public rotation: Vector3
  public mode: number
  public onGround: boolean
  public ridingRuntimeEntityId = 0n
  public teleportationCause: number
  public teleportationItem: number
  public entityType: number
  public currentTick: bigint

  public constructor() {
    super(Protocol.MOVE_PLAYER)
  }

  public encode(stream: WriteStream): void {
    stream.writeUnsignedVarLong(this.runtimeEntityId)
    McpeUtil.writeVector3(stream, this.position)
    McpeUtil.writeVector3(stream, this.rotation)
    stream.writeByte(this.mode)
    stream.writeBoolean(this.onGround)
    stream.writeUnsignedVarLong(this.ridingRuntimeEntityId)
    if (this.mode == MovePlayerMode.TELEPORT) {
      stream.writeIntLE(this.teleportationCause)
      stream.writeIntLE(this.teleportationItem)
    }
    stream.writeUnsignedVarLong(this.currentTick)
  }

  public decode(stream: BinaryStream): void {
    this.runtimeEntityId = stream.readUnsignedVarLong()
    this.position = McpeUtil.readVector3(stream)
    this.rotation = McpeUtil.readVector3(stream)
    this.mode = stream.readByte()
    this.onGround = stream.readBoolean()
    this.ridingRuntimeEntityId = stream.readUnsignedVarLong()
    if (this.mode == MovePlayerMode.TELEPORT) {
      this.teleportationCause = stream.readIntLE()
      this.teleportationItem = stream.readIntLE()
    }
    this.currentTick = stream.readUnsignedVarLong()
  }
}

export enum MovePlayerMode {
  NORMAL,
  RESET,
  TELEPORT,
  PITCH,
}
