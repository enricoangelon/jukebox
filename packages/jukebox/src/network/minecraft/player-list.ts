import { BinaryStream } from '@jukebox/binarystream'
import { DataPacket } from './internal/data-packet'
import { Protocol } from '../protocol'
import { McpeUtil } from '../mcpe-util'
import { EntityPlayer } from '../../entity/entity-player'

export class McpePlayerList extends DataPacket {
  public playerEntries: Array<EntityPlayer>
  public action: PlayerListAction

  public constructor() {
    super(Protocol.PLAYER_LIST)
  }

  public encode(stream: BinaryStream): void {
    stream.writeByte(this.action)
    stream.writeUnsignedVarInt(this.playerEntries.length)
    for (const player of this.playerEntries) {
      McpeUtil.writeUUID(stream, player.getUUID())
      if (this.action == PlayerListAction.ADD) {
        stream.writeVarLong(player.getRuntimeId())
        McpeUtil.writeString(stream, player.getUsername())
        McpeUtil.writeString(stream, '') // TODO: xbl user id
        McpeUtil.writeString(stream, '') // TODO: platformChatId
        stream.writeIntLE(-1) // TODO: build platform
        McpeUtil.writeSkin(stream, player.getSkin())
        stream.writeBoolean(false) // TODO: is teacher
        stream.writeBoolean(false) // TODO: is host
      }
    }

    if (this.action == PlayerListAction.ADD) {
      for (let i = 0, len = this.playerEntries.length; i < len; i++) {
        stream.writeBoolean(false) // TODO: only persona skins
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
