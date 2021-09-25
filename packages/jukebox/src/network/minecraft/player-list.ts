import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Skin } from '../../utils/skin/skin'
import { UUID } from '../../utils/uuid'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpePlayerList extends DataPacket {
  public listEntries: Array<PlayerListEntry>
  public action: PlayerListAction

  public constructor() {
    super(Protocol.PLAYER_LIST)
  }

  public encode(stream: WriteStream): void {
    stream.writeByte(this.action)
    stream.writeUnsignedVarInt(this.listEntries.length)
    for (const entry of this.listEntries) {
      McpeUtil.writeUUID(stream, entry.uuid)
      if (this.action == PlayerListAction.ADD) {
        stream.writeVarLong(entry.uniqueEntityId)
        McpeUtil.writeString(stream, entry.name)
        McpeUtil.writeString(stream, entry.xuid)
        McpeUtil.writeString(stream, entry.platformChatid)
        stream.writeIntLE(entry.buildPlatform)
        McpeUtil.writeSkin(stream, entry.skin)
        stream.writeBoolean(entry.teacher)
        stream.writeBoolean(entry.host)
      }
    }

    if (this.action == PlayerListAction.ADD) {
      for (let i = 0; i < this.listEntries.length; i++) {
        stream.writeBoolean(true) // TODO: only persona skins
      }
    }
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}

export enum PlayerListAction {
  ADD,
  REMOVE,
}

// TODO: i don't like this :(
export class PlayerListEntry {
  public readonly uuid: UUID
  public readonly uniqueEntityId: bigint
  public readonly name: string
  public readonly xuid: string
  public readonly platformChatid: string
  public readonly buildPlatform: number
  public readonly skin: Skin
  public readonly teacher: boolean
  public readonly host: boolean

  public constructor(
    uuid: UUID,
    uniqueEntityId: bigint,
    name: string,
    skin: Skin,
    xuid: string = '',
    platformChatId = '',
    buildPlatform = -1,
    teacher = false,
    host = false
  ) {
    this.uuid = uuid
    this.uniqueEntityId = uniqueEntityId
    this.name = name
    this.xuid = xuid
    this.platformChatid = platformChatId
    this.buildPlatform = buildPlatform
    this.skin = skin
    this.teacher = teacher
    this.host = host
  }
}
