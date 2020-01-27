import { RemoteInfo } from 'dgram'

import { Chunk } from './level/chunk'
import { IPlayer } from './player-interface'
import { Jukebox } from './jukebox'
import { McpePlayStatus } from './network/packets/play-status'
import { McpeResourcePacksInfo } from './network/packets/resource-packs-info'
import { McpeStartGame } from './network/packets/start-game'
import { McpeLevelChunk } from './network/packets/level-chunk'
import { PacketHandler } from './network/packet-handler'
import { PlayStates } from './network/types/play-states'
import { RakNetInstancer } from './network/raknet-instancer'

export class Player implements IPlayer {
  public packetHandler: PacketHandler = new PacketHandler(this) // init autonomous packet handler per player
  public rinfo: RemoteInfo

  public XUID: string | undefined
  public UUID: string | undefined
  public username: string | undefined
  public protocol: string | undefined

  constructor(rinfo: RemoteInfo) {
    this.rinfo = rinfo
  }

  public processJoin() {
    let pk
    // send play status
    pk = new McpePlayStatus()
    pk.status = PlayStates.LOGIN_SUCCESS
    RakNetInstancer.sendDataPacket(pk, this.rinfo)

    // resource packs info [temporary data]
    // this packet is not fully documented yet
    pk = new McpeResourcePacksInfo()
    pk.resourcePackList = []
    pk.isRequired = false
    RakNetInstancer.sendDataPacket(pk, this.rinfo)
  }

  public continueJoinProcess() {
    Jukebox.getLogger().info(`${this.username} is loggin in...`)

    let pk = new McpeStartGame()
    pk.entityUniqueId = 1
    pk.entityRuntimeId = 1
    pk.playerGamemode = 1

    pk.playerPosition = [0, 10, 0]

    pk.pitch = 0
    pk.yaw = 0
    pk.seed = 0xdeadbeef
    pk.dimension = 0
    pk.worldGamemode = 1
    pk.difficulty = 1
    pk.spawnX = 0.0
    pk.spawnY = 10.0
    pk.spawnZ = 0.0
    pk.hasAchievementsDisabled = false
    pk.time = 0
    pk.eduEditionOffer = 0
    pk.rainLevel = 0
    pk.lightningLevel = 0
    pk.commandsEnabled = false
    pk.levelId = ''
    pk.worldName = ''
    RakNetInstancer.sendDataPacket(pk, this.rinfo)
  }

  public sendChunk(chunk: Chunk) {
    let pk
    pk = new McpeLevelChunk()
    pk.chunkX = chunk.x
    pk.chunkZ = chunk.z
    pk.subChunkCount = chunk.getSubChunkSendCount()
    pk.cacheEnabled = false
    pk.extraPayload = chunk.toBinary().toString('hex')
    RakNetInstancer.sendDataPacket(pk, this.rinfo)
  }
}
