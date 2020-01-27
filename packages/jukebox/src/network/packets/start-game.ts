import { Datagram } from '../protocol/datagram'
import { PacketHandler } from '../packet-handler'

export class McpeStartGame extends Datagram {
  public static readonly NETWORK_ID: number = 0x0b

  // entity creation stuff
  public entityUniqueId: number = 0
  public entityRuntimeId: number = 0
  public playerGamemode: number = 0

  public playerPosition: number[] = [0, 0, 0]

  public pitch: number = 0
  public yaw: number = 0

  public seed: number = 0
  public dimension: number = 0
  public generator: number = 1
  public worldGamemode: number = 1
  public difficulty: number = 1
  public spawnX: number = 0
  public spawnY: number = 0
  public spawnZ: number = 0
  public hasAchievementsDisabled: boolean = true
  public time: number = 0
  public eduEditionOffer: number = 0
  public hasEduFeaturesEnabled: boolean = false
  public rainLevel: number = 0.0
  public lightningLevel: number = 0.0
  public hasConfirmedPlatformLockedContent: boolean = false
  public isMultiplayerGame: boolean = true
  public hasLANBroadcast: boolean = true
  public xboxLiveBroadcastMode: number = 0
  public platformBroadcastMode: number = 0
  public commandsEnabled: boolean = true
  public isTexturePacksRequired: boolean = true
  public gameRules /*type*/ = []
  public hasBonusChestEnabled: boolean = false
  public hasStartWithMapEnabled: boolean = false
  public defaultPlayerPermission: number = 0
  public serverChunkTickRadius: number = 4
  public hasLockedBehaviorPack: boolean = false
  public hasLockedResourcePack: boolean = false
  public isFromLockedWorldTemplate: boolean = false
  public useMsaGamertagsOnly: boolean = false
  public isFromWorldTemplate: boolean = false
  public isWorldTemplateOptionLocked: boolean = false
  public onlySpawnV1Villagers: boolean = false
  public vanillaVersion: string = '1.14.1'
  public levelId: string = ''
  public worldName: string = ''
  public premiumWorldTemplateId: string = ''
  public isTrial: boolean = false
  public isMovementServerAuthoritative: boolean = false
  public currentTick: number = 0
  public enchantmentSeed: number = 0
  public multiplayerCorrelationId: string = ''

  public decodePayload() {
    this.entityUniqueId = this.getVarLong()
    this.entityRuntimeId = this.getUnsignedVarLong()
    this.playerGamemode = this.getVarInt()

    this.playerPosition = [this.getLFloat(), this.getLFloat(), this.getLFloat()]

    this.pitch = this.getLFloat()
    this.yaw = this.getLFloat()

    this.seed = this.getVarInt()
    this.dimension = this.getVarInt()
    this.generator = this.getVarInt()
    this.worldGamemode = this.getVarInt()
    this.difficulty = this.getVarInt()
    this.spawnX = this.getVarInt()
    this.spawnY = this.getUnsignedVarInt()
    this.spawnZ = this.getVarInt()
    this.hasAchievementsDisabled = this.getBool()
    this.time = this.getVarInt()
    this.eduEditionOffer = this.getInt()
    this.hasEduFeaturesEnabled = this.getBool()
    this.rainLevel = this.getLFloat()
    this.lightningLevel = this.getLFloat()
    this.hasConfirmedPlatformLockedContent = this.getBool()
    this.isMultiplayerGame = this.getBool()
    this.hasLANBroadcast = this.getBool()
    this.xboxLiveBroadcastMode = this.getVarInt()
    this.platformBroadcastMode = this.getVarInt()
    this.commandsEnabled = this.getBool()
    this.isTexturePacksRequired = this.getBool()
    // this.gameRules =
    this.hasBonusChestEnabled = this.getBool()
    this.hasStartWithMapEnabled = this.getBool()
    this.defaultPlayerPermission = this.getVarInt()
    this.serverChunkTickRadius = this.getLInt()
    this.hasLockedBehaviorPack = this.getBool()
    this.hasLockedResourcePack = this.getBool()
    this.isFromLockedWorldTemplate = this.getBool()
    this.useMsaGamertagsOnly = this.getBool()
    this.isFromWorldTemplate = this.getBool()
    this.isWorldTemplateOptionLocked = this.getBool()

    this.vanillaVersion = this.getString()

    this.levelId = this.getString()
    this.worldName = this.getString()
    this.premiumWorldTemplateId = this.getString()
    this.isTrial = this.getBool()
    this.isMovementServerAuthoritative = this.getBool()
    this.currentTick = this.getLLong()

    this.enchantmentSeed = this.getVarInt()

    this.multiplayerCorrelationId = this.getString()
  }

  public encodePayload() {
    this.putVarLong(this.entityUniqueId)
    this.putUnsignedVarLong(this.entityRuntimeId)
    this.putVarInt(this.playerGamemode)

    this.putLFloat(this.playerPosition[0])
    this.putLFloat(this.playerPosition[1])
    this.putLFloat(this.playerPosition[2])

    this.putLFloat(this.pitch)
    this.putLFloat(this.yaw)

    this.putVarInt(this.seed)
    this.putVarInt(this.dimension)
    this.putVarInt(this.generator)
    this.putVarInt(this.worldGamemode)
    this.putVarInt(this.difficulty)

    this.putVarInt(this.spawnX)
    this.putUnsignedVarInt(this.spawnY)
    this.putVarInt(this.spawnZ)

    this.putBool(this.hasAchievementsDisabled)
    this.putVarInt(this.time)
    this.putVarInt(this.eduEditionOffer)
    this.putBool(this.hasEduFeaturesEnabled)
    this.putLFloat(this.rainLevel)
    this.putLFloat(this.lightningLevel)
    this.putBool(this.hasConfirmedPlatformLockedContent)
    this.putBool(this.isMultiplayerGame)
    this.putBool(this.hasLANBroadcast)
    this.putVarInt(this.xboxLiveBroadcastMode)
    this.putVarInt(this.platformBroadcastMode)
    this.putBool(this.commandsEnabled)
    this.putBool(this.isTexturePacksRequired)

    this.putUnsignedVarInt(this.gameRules.length)
    // TODO now

    this.putBool(this.hasBonusChestEnabled)
    this.putBool(this.hasStartWithMapEnabled)
    this.putVarInt(this.defaultPlayerPermission)
    this.putLInt(this.serverChunkTickRadius)
    this.putBool(this.hasLockedBehaviorPack)
    this.putBool(this.hasLockedResourcePack)
    this.putBool(this.isFromLockedWorldTemplate)
    this.putBool(this.useMsaGamertagsOnly)
    this.putBool(this.isFromWorldTemplate)
    this.putBool(this.isWorldTemplateOptionLocked)
    this.putBool(this.onlySpawnV1Villagers)

    this.putString(this.vanillaVersion)
    this.putString(this.levelId)
    this.putString(this.worldName)
    this.putString(this.premiumWorldTemplateId)
    this.putBool(this.isTrial)
    this.putBool(this.isMovementServerAuthoritative)
    this.putLLong(this.currentTick)

    this.putVarInt(this.enchantmentSeed)

    this.putString(this.multiplayerCorrelationId)
  }

  public handle(packetHandler: PacketHandler): boolean {
    return packetHandler.handleMcpeStartGame(this)
  }
}
