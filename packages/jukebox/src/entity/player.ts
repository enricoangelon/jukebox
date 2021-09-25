import { Jukebox } from '../jukebox'
import { PlayerConnection } from '../network/player-connection'
import { PlayerLoginData } from '../network/player-login-data'
import { Skin } from '../utils/skin/skin'
import { UUID } from '../utils/uuid'
import { CoordinateUtils } from '../world/coordinate-utils'
import { World } from '../world/world'
import { Attribute } from './attribute/attribute'
import { EntityFlag } from './flag'
import { EntityLiving } from './living'
import { MetadataFlags } from './metadata/flags'
import { EntityType } from './type'

export class EntityPlayer extends EntityLiving {
  private connection: PlayerConnection

  private xuid: string
  private uuid: UUID
  private username: string
  private skin: Skin

  private viewRadius: number

  private loadingChunks: Set<string> = new Set()
  private loadedChunks: Set<string> = new Set()

  public constructor(world: World, connection: PlayerConnection) {
    super(EntityType.PLAYER, world)
    this.connection = connection

    // Set player-only metadata
    this.metadata.setByte(MetadataFlags.PLAYER_FLAGS, 0)
    this.metadata.setShort(MetadataFlags.AIR, 400)
    this.metadata.setShort(MetadataFlags.MAX_AIRDATA_MAX_AIR, 400)
    this.metadata.setDataFlag(MetadataFlags.INDEX, EntityFlag.BREATHING, true)
  }

  protected initCustomAttributes(): void {
    // TODO: attributes manipulation API
    this.attributes.set('minecraft:luck', new Attribute(-1024.0, 1024.0, 0.0))
    this.attributes.set('minecraft:player.saturation', new Attribute(0, 20, 20))
    this.attributes.set(
      'minecraft:player.exhaustion',
      new Attribute(0, 4, 0, 0.45000002)
    )
    this.attributes.set('minecraft:player.hunger', new Attribute(0, 20, 20))
    this.attributes.set('minecraft:player.level', new Attribute(0, 24791, 0))
    this.attributes.set('minecraft:player.experience', new Attribute(0, 1, 0))
  }

  public tick(currentTick: number): void {
    this.connection.process()
    super.tick(currentTick)

    if (this.getConnection().isInitialized()) {
      // this.sendNewChunks(this.viewRadius)
    }

    // TODO: event
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
      ;(async () => {
        const chunk = await this.getWorld().getChunk(newX, newZ)
        const encodedPos = CoordinateUtils.chunkHash(newX, newZ)
        if (!this.loadingChunks.has(encodedPos)) {
          return
        }

        const wrapper = await chunk.getWrapper()
        this.getConnection().sendImmediateWrapper(wrapper)
        this.loadedChunks.add(encodedPos)
        this.loadingChunks.delete(encodedPos)
      })()
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
    this.xuid = data.XUID
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

  public getXUID(): string {
    return this.xuid
  }

  public getUUID(): UUID {
    return this.uuid
  }

  public setUsername(username: string): void {
    this.username = username
    // TODO: broken this.connection.sendUpdatedPlayerList()
  }

  public close(): void {}

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
