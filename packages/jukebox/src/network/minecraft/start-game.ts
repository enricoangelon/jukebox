import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { Vector3 } from '../../math/vector3'
import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeStartGame extends DataPacket {
  public entityId: bigint
  public runtimeEntityId: bigint

  public playerGamemode: number
  public playerSpawnVector: Vector3

  public pitch: number
  public yaw: number

  public seed: number
  public biomeType: number
  public biomeName: string
  public dimension: number
  public generator: number
  public gamemode: number
  public difficulty: number
  public spawnVector: Vector3

  public hasAchievementsDisabled: boolean
  public dayCycleStopTime: number

  public eduOffer: number
  public eduFeaturesEnabled: boolean
  public eduProductId: string

  public rainLevel: number
  public lightningLevel: number

  public hasConfirmedPlatformLockedContent: boolean

  public isMultiplayer: boolean
  public lanBroadcast: boolean
  public xblBroadcastMode: number
  public platformBroadcastMode: number

  public commandsEnabled: boolean
  public texturePacksRequired: boolean
  public gamerules: Array<any>
  public experiments: Array<any>
  public experimentsToggledBefore: boolean
  public hasBonusChestEnabled: boolean
  public hasStarterMapEnabled: boolean
  public permissionLevel: number
  public chunkTickRange: number
  public hasLockedBehaviorPack: boolean
  public hasLockedResourcePack: boolean
  public isFromLockedWorldTemplate: boolean
  public onlyMsaGamertags: boolean
  public isFromWorldTemplate: boolean
  public isWorldTemplateOptionLocked: boolean
  public spawnOnlyV1Villagers: boolean
  public limitedWorldWidth: number
  public limitedWorldHeight: number
  public hasNewNether: boolean
  public forceExperimentalGameplay: boolean

  public levelId: string
  public worldName: string
  public premiumWorldTemplateId: string
  public isTrial: boolean
  public movementType: number
  public rewindHistorySize: number
  public serverAuthoritativeBlockBreaking: boolean
  public worldTicks: bigint
  public enchantmentSeed: number
  public customBlocks: Array<any>
  public itemPalette: Array<any>
  public multiplayerCorrelationId: string
  public serverAuthoritativeInventory: boolean
  public softwareVersion: string

  public constructor() {
    super(Protocol.START_GAME)
  }

  public encode(stream: WriteStream): void {
    stream.writeVarLong(this.entityId)
    stream.writeUnsignedVarLong(this.runtimeEntityId)

    stream.writeVarInt(this.playerGamemode)
    McpeUtil.writeVector3(stream, this.playerSpawnVector)

    stream.writeFloatLE(this.pitch)
    stream.writeFloatLE(this.yaw)

    stream.writeVarInt(this.seed)
    stream.writeShortLE(this.biomeType)
    McpeUtil.writeString(stream, this.biomeName)
    stream.writeVarInt(this.dimension)
    stream.writeVarInt(this.generator)
    stream.writeVarInt(this.gamemode)
    stream.writeVarInt(this.difficulty)
    McpeUtil.writeBlockCoords(stream, this.spawnVector)

    stream.writeBoolean(this.hasAchievementsDisabled)
    stream.writeVarInt(this.dayCycleStopTime)

    stream.writeVarInt(this.eduOffer)
    stream.writeBoolean(this.eduFeaturesEnabled)
    McpeUtil.writeString(stream, this.eduProductId)

    stream.writeFloatLE(this.rainLevel)
    stream.writeFloatLE(this.lightningLevel)

    stream.writeBoolean(this.hasConfirmedPlatformLockedContent)

    stream.writeBoolean(this.isMultiplayer)
    stream.writeBoolean(this.lanBroadcast)
    stream.writeVarInt(this.xblBroadcastMode)
    stream.writeVarInt(this.platformBroadcastMode)

    stream.writeBoolean(this.commandsEnabled)
    stream.writeBoolean(this.texturePacksRequired)

    // TODO: GameRules
    stream.writeUnsignedVarInt(this.gamerules.length)

    // TODO: Experiments
    stream.writeIntLE(this.experiments.length)
    stream.writeBoolean(this.experimentsToggledBefore)

    stream.writeBoolean(this.hasBonusChestEnabled)
    stream.writeBoolean(this.hasStarterMapEnabled)

    stream.writeVarInt(this.permissionLevel)

    stream.writeIntLE(this.chunkTickRange)

    stream.writeBoolean(this.hasLockedBehaviorPack)
    stream.writeBoolean(this.hasLockedResourcePack)
    stream.writeBoolean(this.isFromLockedWorldTemplate)
    stream.writeBoolean(this.onlyMsaGamertags)
    stream.writeBoolean(this.isFromWorldTemplate)
    stream.writeBoolean(this.isWorldTemplateOptionLocked)
    stream.writeBoolean(this.spawnOnlyV1Villagers)
    McpeUtil.writeString(stream, Protocol.MC_VERSION)

    stream.writeIntLE(this.limitedWorldHeight)
    stream.writeIntLE(this.limitedWorldWidth)

    stream.writeBoolean(this.hasNewNether)
    stream.writeBoolean(this.forceExperimentalGameplay)

    McpeUtil.writeString(stream, this.levelId)
    McpeUtil.writeString(stream, this.worldName)
    McpeUtil.writeString(stream, this.premiumWorldTemplateId)

    stream.writeBoolean(this.isTrial)
    stream.writeUnsignedVarInt(this.movementType)
    stream.writeVarInt(this.rewindHistorySize)
    stream.writeBoolean(this.serverAuthoritativeBlockBreaking)
    stream.writeLongLE(this.worldTicks)
    stream.writeVarInt(this.enchantmentSeed)

    // TODO: both items & blocks
    stream.writeUnsignedVarInt(this.customBlocks.length)
    stream.writeUnsignedVarInt(this.itemPalette.length)

    McpeUtil.writeString(stream, this.multiplayerCorrelationId)
    stream.writeBoolean(this.serverAuthoritativeInventory)
    McpeUtil.writeString(stream, this.softwareVersion)
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
