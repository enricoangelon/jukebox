import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { MetadataContainer } from '../../entity/metadata/container'
import { Vector3 } from '../../math/vector3'
import { UUID } from '../../utils/uuid'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeAddPlayer extends DataPacket {
  public uuid: UUID
  public username: string
  public uniqueEntityId: bigint
  public runtimeEntityId: bigint
  public platformChatId: string
  public position: Vector3
  public motion: Vector3
  public pitch: number
  public yaw: number
  public headYaw: number
  public item: any // TODO: item instance
  public metadata: MetadataContainer
  public links: Array<any> // TODO
  public devideId: string
  public buildPlatform: number

  public constructor() {
    super(Protocol.ADD_PLAYER)
  }

  public encode(stream: WriteStream): void {
    McpeUtil.writeUUID(stream, this.uuid)
    McpeUtil.writeString(stream, this.username)
    stream.writeVarLong(this.uniqueEntityId)
    stream.writeUnsignedVarLong(this.runtimeEntityId)
    McpeUtil.writeString(stream, this.platformChatId)
    McpeUtil.writeVector3(stream, this.position) // block position?
    McpeUtil.writeVector3(stream, this.motion)
    stream.writeFloatLE(this.pitch)
    stream.writeFloatLE(this.yaw)
    stream.writeFloatLE(this.headYaw)
    // TODO: items, for now i'll put air
    stream.writeVarInt(0)
    McpeUtil.writeMetadata(stream, this.metadata)
    // AdventureSettings, to understand
    for (let i = 0; i < 5; i++) {
      stream.writeUnsignedVarInt(0)
    }
    stream.writeLongLE(0n) // unknown
    stream.writeUnsignedVarInt(this.links.length)
    // TODO: entity links
    McpeUtil.writeString(stream, this.devideId)
    stream.writeIntLE(this.buildPlatform)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
