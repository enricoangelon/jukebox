import { Chunk } from '../world/chunk/chunk'
import { Entity } from './entity'
import { EntityType } from './entity-type'
import { McpeLevelChunk } from '../network/minecraft/level-chunk'
import { McpeNetworkChunkPublisherUpdate } from '../network/minecraft/network-chunk-publisher-update'
import { PlayerConnection } from '../network/player-connection'
import { World } from '../world/world'

export class EntityPlayer extends Entity {
  private connection: PlayerConnection

  public viewRadius: number

  public constructor(world: World | undefined, connection: PlayerConnection) {
    // TODO: proper worlds
    super(EntityType.PLAYER, world ?? new World()) // Just temp world
    this.connection = connection
  }

  public tick(timestamp: number): void {
    super.tick(timestamp)
  }

  public getConnection(): PlayerConnection {
    return this.connection
  }
}
