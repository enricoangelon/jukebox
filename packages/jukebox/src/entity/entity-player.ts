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

  private loadedChunks: Map<string, Chunk> = new Map()
  private chunksToLoad: Set<string> = new Set()
  private chunkLoadQueue: Array<Promise<Chunk>> = new Array()

  public constructor(world: World | undefined, connection: PlayerConnection) {
    // TODO: proper worlds
    super(EntityType.PLAYER, world ?? new World()) // Just temp world
    this.connection = connection
  }

  public tick(timestamp: number): void {
    super.tick(timestamp)
    // this.checkForNewChunks()

    /*
    if (this.chunkLoadQueue.length > 0) {
      Promise.all(this.chunkLoadQueue).then(chunks => {
        chunks.forEach(chunk => {
          const hash = `${chunk.getX()}:${chunk.getZ()}`
          if (!this.chunksToLoad.has(hash)) {
            return
          }

          this.connection.sendImmediateDataPacket(chunk.serializeToPacket())
        })
      })
    }
    */
  }

  public checkForNewChunks(): void {
    const networkChunkPublisherUpdate = new McpeNetworkChunkPublisherUpdate()
    networkChunkPublisherUpdate.position = this.position
    networkChunkPublisherUpdate.radius = 1 * 16
    this.connection.sendQueuedDataPacket(networkChunkPublisherUpdate)

    // TODO: test with 2 chunks for x and z
    const promises = []
    for (let cx = -2; cx <= 2; cx++) {
      for (let cz = -2; cz <= 2; cz++) {
        promises.push(this.world.getChunkAsync(cx, cz))
      }
    }
    Promise.all(promises).then(chunks =>
      chunks.forEach(chunk =>
        this.connection.sendQueuedDataPacket(chunk.serializeToPacket())
      )
    )

    // From player position to chunk slice
    // const chunkX = this.getPosition().getX() >> 4
    // const chunkZ = this.getPosition().getZ() >> 4

    // Cache the radius to avoid side effects
    // const radius = this.viewRadius

    // Get every chunk from chunk - radius to chunk + radius
    // for both chunk X and Zs
    // const chunksToSend: Array<Array<number>> = []
    /* 
    for (
    let sendChunkX = chunkX - radius;
      sendChunkX <= chunkX + radius;
      sendChunkX++
    ) {
      for (
        let sendChunkZ = chunkZ - radius;
        sendChunkZ <= chunkZ + radius;
        sendChunkZ++
      ) {
        const hash = `${sendChunkX}:${sendChunkZ}`
        if (!this.loadedChunks.has(hash) && !this.chunksToLoad.has(hash)) {
          chunksToSend.push([sendChunkX, sendChunkZ])
        }
      }
    }

    if (chunksToSend.length > 0) {
      // this.connection.sendQueuedDataPacket()
    }

    chunksToSend.sort((o1, o2) => {
      if (o1[0] == o2[0] && o1[1] == o2[1]) {
        return 0
      }

      const distXFirst = Math.abs(o1[0] - chunkX)
      const distXSecond = Math.abs(o2[0] - chunkX)

      const distZFirst = Math.abs(o1[1] - chunkZ)
      const distZSecond = Math.abs(o2[1] - chunkZ)

      if (distXFirst + distZFirst > distXSecond + distZSecond) {
        return 1
      } else if (distXFirst + distZFirst < distXSecond + distZSecond) {
        return -1
      }

      return 0
    })

    for (const chunk of chunksToSend) {
      const hash = `${chunk[0]}:${chunk[1]}`
      this.chunksToLoad.add(hash)
      this.chunkLoadQueue.push(this.world.getChunkAsync(chunk[0], chunk[1]))
    }
    */
  }

  public getConnection(): PlayerConnection {
    return this.connection
  }
}
