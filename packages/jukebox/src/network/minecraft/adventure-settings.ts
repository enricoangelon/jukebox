import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeAdventureSettings extends DataPacket {
  public flags: number
  public commandPermissionLevel: number
  public actionPermission: number
  public permissionLevel: number
  public customFlags: number
  public uniqueEntityId: bigint

  public constructor() {
    super(Protocol.ADVENTURE_SETTINGS)
  }

  public encode(stream: WriteStream): void {
    stream.writeUnsignedVarInt(this.flags)
    stream.writeUnsignedVarInt(this.commandPermissionLevel)
    stream.writeUnsignedVarInt(this.actionPermission)
    stream.writeUnsignedVarInt(this.permissionLevel)
    stream.writeUnsignedVarInt(this.customFlags)
    stream.writeLongLE(this.uniqueEntityId)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}

// TODO: maybe move to other folder /jukebox/permission ?!
export enum PermissionLevel {
  NORMAL,
  OPERATOR,
  HOST,
  AUTOMATION,
  ADMIN,
}

export enum AdventureSetting {
  WORLD_IMMUTABLE = 0x01,
  NO_PVP = 0x02,
  AUTO_JUMP = 0x20,
  CAN_FLY = 0x40,
  NO_CLIP = 0x80,
  WORLD_BUILDER = 0x100,
  FLYING = 0x200,
  MUTED = 0x400,
}

export enum ActionPermission {
  BUILD_AND_MINE = 0x01,
  USE_DOORS_AND_SWITCHES = 0x02,
  OPEN_CONTAINERS = 0x04,
  ATTACK_PLAYERS = 0x08,
  ATTACK_MOBS = 0x10,
  OPERATOR = 0x20,
  TELEPORT = 0x80,
}
