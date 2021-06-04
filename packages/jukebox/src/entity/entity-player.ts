import { Chunk } from '../world/chunk/chunk'
import { CoordinateUtils } from '../world/coordinate-utils'
import { Entity } from './entity'
import { EntityType } from './entity-type'
import { McpeNetworkChunkPublisherUpdate } from '../network/minecraft/network-chunk-publisher-update'
import { PlayerConnection } from '../network/player-connection'
import { World } from '../world/world'

export class EntityPlayer extends Entity {
  private connection: PlayerConnection

  public viewRadius: number

  private loadedChunks: Set<string> = new Set()

  public constructor(world: World, connection: PlayerConnection) {
    // TODO: proper worlds
    super(EntityType.PLAYER, world) // Just temp world
    this.connection = connection
  }

  public tick(timestamp: number): void {
    super.tick(timestamp)
    this.needNewChunks().then(chunksToLoad => {
      const worldChunkPromises: Array<Promise<Chunk>> = []
      chunksToLoad.forEach(chunkToLoad => {
        worldChunkPromises.push(
          this.world.generateFlatChunkAsync(chunkToLoad[0], chunkToLoad[1])
        )
      })
      Promise.all(worldChunkPromises).then(chunks => {
        chunks.forEach(chunk => {
          this.connection.sendImmediateWrapper(chunk.getWrapper())
          this.loadedChunks.add(
            CoordinateUtils.toHash([chunk.getX(), chunk.getZ()])
          )
        })
      })
    })
  }

  public async needNewChunks(): Promise<Array<Array<number>>> {
    // Player current position to chunk position
    const currentChunkX = this.position.getX() >> 4
    const currentChunkZ = this.position.getZ() >> 4

    // Cache chunk radius to avoid modifications during computation
    const viewRadius = this.viewRadius

    const chunksToSend: Array<Array<number>> = []
    for (let sendChunkX = -viewRadius; sendChunkX <= viewRadius; sendChunkX++) {
      for (
        let sendChunkZ = -viewRadius;
        sendChunkZ <= viewRadius;
        sendChunkZ++
      ) {
        const chunkDistance = Math.round(
          Math.sqrt(sendChunkZ * sendChunkZ + sendChunkX * sendChunkX)
        )
        if (chunkDistance <= viewRadius) {
          const newChunk = [
            currentChunkX + sendChunkX,
            currentChunkZ + sendChunkZ,
          ]
          const hash = CoordinateUtils.toHash(newChunk)
          if (!this.loadedChunks.has(hash)) {
            chunksToSend.push(newChunk)
          }
        }
      }
    }

    if (chunksToSend.length > 0) {
      const networkChunkPublisherUpdate = new McpeNetworkChunkPublisherUpdate()
      networkChunkPublisherUpdate.position = this.position
      networkChunkPublisherUpdate.radius = this.viewRadius * 16
      this.connection.sendImmediateDataPacket(networkChunkPublisherUpdate)
    }

    return chunksToSend
  }

  public getConnection(): PlayerConnection {
    return this.connection
  }
}
