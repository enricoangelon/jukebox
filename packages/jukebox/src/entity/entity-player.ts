import { Entity } from './entity'
import { EntityType } from './entity-type'
import { PlayerConnection } from '../network/player-connection'
import { PlayerLoginData } from '../network/player-login-data'
import { World } from '../world/world'
import { CoordinateUtils } from '../world/coordinate-utils'
import { Jukebox } from '../jukebox'
import { Skin } from '../utils/skin/skin'
import { UUID } from '../utils/uuid'

export class EntityPlayer extends Entity {
  private connection: PlayerConnection

  private uuid: UUID
  private username: string
  private skin: Skin

  private viewRadius: number

  private loadingChunks: Set<string> = new Set()
  private loadedChunks: Set<string> = new Set()

  public constructor(world: World, connection: PlayerConnection) {
    // TODO: proper worlds
    super(EntityType.PLAYER, world)
    this.connection = connection

    Jukebox.getServer().on('tick', timestamp => this.tick(timestamp))
  }

  public tick(timestamp: number): void {
    this.connection.process(timestamp)
    super.tick(timestamp)

    if (this.getConnection().isInitialized()) {
      this.sendNewChunks(this.viewRadius)
    }
  }

  public async sendNewChunks(radius: number): Promise<void> {
    const chunkX = CoordinateUtils.fromBlockToChunk(this.getPosition().getX())
    const chunkZ = CoordinateUtils.fromBlockToChunk(this.getPosition().getZ())

    const chunksToSend: Array<[number, number]> = []

    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        const chunkDistance = Math.round(Math.sqrt(z * z + x * x))
        if (chunkDistance <= radius) {
          const newX = chunkX + x,
            newZ = chunkZ + z
          const hash = CoordinateUtils.chunkHash(newX, newZ)
          if (!this.loadedChunks.has(hash) && !this.loadingChunks.has(hash)) {
            this.loadingChunks.add(hash)
            chunksToSend.push([newX, newZ])
          }
        }
      }
    }

    // Send closer chunks before
    chunksToSend.sort((c1, c2) => {
      if (c1[0] == c2[0] && c1[1] == c2[1]) {
        return 0
      }

      const distXFirst = Math.abs(c1[0] - chunkX)
      const distXSecond = Math.abs(c2[0] - chunkX)

      const distZFirst = Math.abs(c1[1] - chunkZ)
      const distZSecond = Math.abs(c2[1] - chunkZ)

      if (distXFirst + distZFirst > distXSecond + distZSecond) {
        return 1
      }

      if (distXFirst + distZFirst < distXSecond + distZSecond) {
        return -1
      }

      return 0
    })

    for (const [newX, newZ] of chunksToSend) {
      this.getWorld()
        .getChunk(newX, newZ)
        .then(chunk => {
          const encodedPos = CoordinateUtils.chunkHash(newX, newZ)
          if (!this.loadingChunks.has(encodedPos)) {
            return
          }

          this.getConnection().sendImmediateWrapper(chunk.getWrapper())
          this.loadedChunks.add(encodedPos)
          this.loadingChunks.delete(encodedPos)
        })
    }

    let unloaded = false
    for (const hash of this.loadedChunks) {
      const [x, z] = CoordinateUtils.getXZ(hash)

      if (Math.abs(x - chunkX) > radius || Math.abs(z - chunkZ) > radius) {
        unloaded = true
        this.loadedChunks.delete(hash)
      }
    }

    for (const hash of this.loadingChunks) {
      const [x, z] = CoordinateUtils.getXZ(hash)

      if (Math.abs(x - chunkX) > radius || Math.abs(z - chunkZ) > radius) {
        this.loadingChunks.delete(hash)
      }
    }

    if (unloaded ?? chunksToSend.length > 0) {
      this.getConnection().sendNetworkChunkPublisherUpdate(this.getViewRadius())
    }
  }

  public setLoginData(data: PlayerLoginData): void {
    this.uuid = UUID.fromString(data.identity, 4)
    this.skin = Skin.fromJWT(data)
    this.setUsername(data.displayName)
    // TODO: complete login data
  }

  public getViewRadius(): number {
    return this.viewRadius
  }

  public setViewRadius(radius: number): void {
    this.viewRadius = radius
    this.getConnection().sendChunkRadiusUpdated(radius)
  }

  public getUUID(): UUID {
    return this.uuid
  }

  public setUsername(username: string): void {
    this.username = username
    this.connection.sendUpdatedPlayerList()
  }

  public getUsername(): string {
    return this.username
  }

  public getSkin(): Skin {
    return this.skin
  }

  public getConnection(): PlayerConnection {
    return this.connection
  }
}
