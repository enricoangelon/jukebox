import { PlayerConnection } from './player-connection'

/**
 * This class contains everything network session-related,
 * for example will hold client container IDs, and many other things.
 * This is still a protoype because i need to think on the implementation.
 */
export class PlayerSession {
  private readonly connection: PlayerConnection

  public constructor(connection: PlayerConnection) {
    this.connection = connection
  }

  /*
  public doInitialSpawn(): void {
    const startGame = new McpeStartGame()
    startGame.entityId = this.player.getRuntimeId()
    startGame.runtimeEntityId = this.player.getRuntimeId()

    startGame.playerGamemode = Gamemode.USE_WORLD
    startGame.playerSpawnVector = this.player.getPosition().add(0, 6, 0) // TODO: test purpose

    startGame.pitch = 0
    startGame.yaw = 0

    startGame.seed = 0xdeadbeef
    startGame.biomeType = 0
    startGame.biomeName = ''
    startGame.dimension = Dimension.OVERWORLD
    startGame.generator = Generator.FLAT
    startGame.gamemode = Gamemode.CREATIVE
    startGame.difficulty = Difficulty.PEACEFUL
    startGame.spawnVector = new Vector3(0, 6, 0)

    startGame.hasAchievementsDisabled = true
    startGame.dayCycleStopTime = 0

    startGame.eduOffer = 0 // TODO: enum
    startGame.eduFeaturesEnabled = false
    startGame.eduProductId = ''

    startGame.rainLevel = 0
    startGame.lightningLevel = 0

    startGame.hasConfirmedPlatformLockedContent = false

    startGame.isMultiplayer = true
    startGame.lanBroadcast = true
    startGame.xblBroadcastMode = 0
    startGame.platformBroadcastMode = 0

    startGame.commandsEnabled = true
    startGame.texturePacksRequired = false
    startGame.gamerules = new Array(0)
    startGame.experiments = new Array(0)
    startGame.experimentsToggledBefore = false
    startGame.hasBonusChestEnabled = false
    startGame.hasStarterMapEnabled = false
    startGame.permissionLevel = 3
    startGame.chunkTickRange = 4
    startGame.hasLockedBehaviorPack = false
    startGame.hasLockedResourcePack = false
    startGame.isFromLockedWorldTemplate = false
    startGame.onlyMsaGamertags = false
    startGame.isFromWorldTemplate = false
    startGame.isWorldTemplateOptionLocked = false
    startGame.spawnOnlyV1Villagers = false

    startGame.limitedWorldHeight = 0
    startGame.limitedWorldWidth = 0

    startGame.hasNewNether = false
    startGame.forceExperimentalGameplay = false

    startGame.levelId = ''
    startGame.worldName = 'Jukebox Server'
    startGame.premiumWorldTemplateId = ''

    startGame.isTrial = false
    startGame.movementType = 0
    startGame.rewindHistorySize = 0
    startGame.serverAuthoritativeBlockBreaking = false

    startGame.worldTicks = 0n

    startGame.enchantmentSeed = 0

    startGame.customBlocks = new Array(0)
    startGame.itemPalette = new Array(0)

    startGame.multiplayerCorrelationId = ''
    // Soon client-side inventory will be deprecated
    startGame.serverAuthoritativeInventory = true
    startGame.softwareVersion = 'Jukebox v0.0.1'
    this.sendQueuedDataPacket(startGame)

    const creativeContent = new McpeCreativeContent()
    creativeContent.entries = new Array(0)
    this.sendQueuedDataPacket(creativeContent)

    const biomeDefinitionList = new McpeBiomeDefinitionList()
    this.sendQueuedDataPacket(biomeDefinitionList)
  }
  */

  public getConnection(): PlayerConnection {
    return this.connection
  }
}
