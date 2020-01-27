import { Batched } from './protocol/batched'
import { Datagram } from './protocol/datagram'
import { Jukebox } from '../jukebox'
import { Player } from '../player'
import { McpeLogin } from './packets/login'
import { McpePlayStatus } from './packets/play-status'
import { McpeResourcePacksInfo } from './packets/resource-packs-info'
import { McpeClientCacheStatus } from './packets/client-cache-status'
import { McpeResourcePackClientResponse } from './packets/resource-pack-client-response'
import { ResourcePackClientResponses } from './types/resource-packs/resource-pack-client-responses'
import { McpeResourcePackDataInfo } from './packets/resource-pack-data-info'
import { McpeResourcePackStack } from './packets/resource-pack-stack'
import { RakNetInstancer } from './raknet-instancer'
import { McpeStartGame } from './packets/start-game'
import { McpeRequestChunkRadius } from './packets/request-chunk-radius'
import { McpeChunkRadiusUpdated } from './packets/chunk-radius-updated'
import { PlayStates } from './types/play-states'
import { McpeLevelChunk } from './packets/level-chunk'
import { Chunk } from '../level/chunk'

export class PacketHandler {
  private player: Player
  constructor(owner: Player) {
    this.player = owner
  }
  // internals
  public handleBatched(packet: Buffer) {
    Jukebox.getLogger().debug(`Handling batched`)

    let pk = new Batched(packet)
    pk.decode()
    pk.handle(this)
  }

  public handleDatagram(packet: Datagram) {
    Jukebox.getLogger().debug(`Handling now: ${packet.getName()}`)

    packet.decode()

    if (!packet.feof() && !packet.mayHaveUnreadBytes) {
      let remains = packet.getBuffer().slice(packet.offset)
      Jukebox.getLogger().warn(
        `Still ${
          remains.length
        } unread bytes in ${packet.getName()}: 0x${remains.toString('hex')}`
      )
    }

    packet.handle(this)
    // todo: make automaitc handle system like this[`handle${packet.getName()}`](packet)
  }

  // player packets
  public handleMcpeLogin(packet: McpeLogin): boolean {
    this.player.XUID = packet.XUID
    this.player.UUID = packet.identity
    this.player.username = packet.displayName
    this.player.processJoin()
    return true
  }

  public handleMcpePlayStatus(_packet: McpePlayStatus): boolean {
    return false
  }

  public handleResourcePacksInfo(_packet: McpeResourcePacksInfo): boolean {
    return false
  }

  public handleMcpeClientCacheStatus(_packet: McpeClientCacheStatus): boolean {
    return false
  }

  public handleResourcePackClientResponse(
    packet: McpeResourcePackClientResponse
  ): boolean {
    switch (packet.status) {
      case ResourcePackClientResponses.STATUS_REFUSED:
        // TODO close client
        break
      case ResourcePackClientResponses.STATUS_SEND_PACKS:
        // TODO resource packs logic
        // not used atm
        // let pk = new McpeResourcePackDataInfo()
        // pk.packId = 0
        break
      case ResourcePackClientResponses.STATUS_HAVE_ALL_PACKS:
        let pk = new McpeResourcePackStack()
        pk.resourcePackStack = []
        pk.required = false
        RakNetInstancer.sendDataPacket(pk, this.player.rinfo)
        break
      case ResourcePackClientResponses.STATUS_COMPLETED:
        this.player.continueJoinProcess()
      default:
        return false
    }

    return true
  }

  public handleMcpeResourcePackDataInfo(
    _packet: McpeResourcePackDataInfo
  ): boolean {
    return false
  }

  public handleMcpeResourcePackStack(_packet: McpeResourcePackStack): boolean {
    return false
  }

  public handleMcpeStartGame(_packet: McpeStartGame): boolean {
    return false
  }

  public async handleMcpeRequestChunkRadius(
    packet: McpeRequestChunkRadius
  ): Promise<boolean> {
    let pk, radius
    radius = packet.radius
    pk = new McpeChunkRadiusUpdated()
    pk.radius = radius
    RakNetInstancer.sendDataPacket(pk, this.player.rinfo)

    await this.sendChunks(radius)

    pk = new McpePlayStatus()
    pk.status = PlayStates.PLAYER_SPAWN
    RakNetInstancer.sendDataPacket(pk, this.player.rinfo)

    Jukebox.getLogger().debug('Spawning player...')

    return true
  }

  public async sendChunks(radius: number) {
    for (let chunkX = -radius; chunkX <= radius; chunkX++) {
      for (let chunkZ = -radius; chunkZ <= radius; chunkZ++) {
        let chunk = new Chunk(chunkX, chunkZ)

        for (let x = 0; x < 16; x++) {
          for (let z = 0; z < 16; z++) {
            let y = 0
            chunk.setBlockId(x, y++, z, 7)
            chunk.setBlockId(x, y++, z, 3)
            chunk.setBlockId(x, y++, z, 3)
            chunk.setBlockId(x, y, z, 2)
          }
        }
        chunk.recalculateHeightMap()
        this.player.sendChunk(chunk)
      }
    }
  }

  public handleMcpeChunkRadiusUpdated(
    _packet: McpeChunkRadiusUpdated
  ): boolean {
    return false
  }

  public handleMcpeLevelChunk(_packet: McpeLevelChunk): boolean {
    return false
  }
}
