import { Socket } from '@jukebox/raknet'
import { resolve } from 'path'
import { RemoteInfo } from 'dgram'

import { Batched } from './network/protocol/batched'
import { Config } from './config'
import { Datagram } from './network/protocol/datagram'
import { Logger } from './logger'
import { McpeLogin } from './network/packets/login'
import { McpePlayStatus } from './network/packets/play-status'
import { McpeResourcePacksInfo } from './network/packets/resource-packs-info'
import { McpeClientCacheStatus } from './network/packets/client-cache-status'
import { McpeResourcePackClientResponse } from './network/packets/resource-pack-client-response'
import { McpeResourcePackDataInfo } from './network/packets/resource-pack-data-info'
import { McpeResourcePackStack } from './network/packets/resource-pack-stack'
import { McpeStartGame } from './network/packets/start-game'
import { McpeChunkRadiusUpdated } from './network/packets/chunk-radius-updated'
import { McpeLevelChunk } from './network/packets/level-chunk'
import { McpeRequestChunkRadius } from './network/packets/request-chunk-radius'
import { RakNetInstancer } from './network/raknet-instancer'

export class Jukebox {
  private static instance: Jukebox
  private config: Required<Config>
  private socketAdapter: RakNetInstancer | undefined
  public static packetPool: Map<number, Datagram> = new Map()
  public static readonly serverID: number = Math.floor(
    Math.random() * 99999999 + 1
  )

  constructor(config: Required<Config>) {
    this.config = config
    if (Jukebox.instance) {
      this.config.logger.fatal(
        'Attempted to start the server twice on a single node process.'
      )
    }

    Jukebox.instance = this
    this.start()
  }

  public start() {
    this.socketAdapter = new RakNetInstancer()
    this.loadPacketPool()

    // TODO: Implement bootstrapping
  }

  private async loadPacketPool() {
    Jukebox.packetPool.set(0x01, new McpeLogin())
    Jukebox.packetPool.set(0x02, new McpePlayStatus())
    Jukebox.packetPool.set(0x06, new McpeResourcePacksInfo())
    Jukebox.packetPool.set(0x07, new McpeResourcePackStack())
    Jukebox.packetPool.set(0x08, new McpeResourcePackClientResponse())
    Jukebox.packetPool.set(0x52, new McpeResourcePackDataInfo())
    Jukebox.packetPool.set(0x81, new McpeClientCacheStatus())
    Jukebox.packetPool.set(0x0b, new McpeStartGame())
    Jukebox.packetPool.set(0x45, new McpeRequestChunkRadius())
    Jukebox.packetPool.set(0x46, new McpeChunkRadiusUpdated())
    Jukebox.packetPool.set(0x3a, new McpeLevelChunk())

    Jukebox.getLogger().info(
      `Loaded ${Jukebox.packetPool.size} MCPE packet handlers`
    )
    /* try { //not working
      const dir = join(__dirname, 'network/packets')
      const files = await promisify(readdir)(dir)

      const imports = await Promise.all(
        files
          .filter(filename => filename.endsWith('.js'))
          .map(filename => join(dir, filename))
          .map(async filepath => import(filepath))
      )

      imports
        .forEach(i =>
          Jukebox.packetPool.set(i.NETWORK_ID as number, i as Datagram)
        )

      Jukebox.getLogger().info(
        `Loaded ${Jukebox.packetPool.size} MCPE packet handlers`
      )
    } catch (err) {
      Jukebox.getLogger().fatal('Could not load packets', err)
    }*/
  }

  public static sendPacket(packet: Datagram | Batched, rinfo: RemoteInfo) {
    if (!packet.encoded) {
      packet.encode()
    }

    Socket.sendBuffer(packet.getBuffer(), rinfo.port, rinfo.address)
  }

  public shutdown() {
    // TODO: implement shutdown
  }

  public static getConfig(): Required<Config> {
    return Jukebox.instance.config
  }

  public static getLogger(): Logger {
    return Jukebox.instance.config.logger
  }

  public static getPort(): number {
    return Jukebox.getConfig().server.port || 19132
  }
}

;(async function() {
  // node <file> <config>
  if (process.argv.length < 3) {
    console.error('Usage: node jukebox.js <config>')
    process.exit(1)
  }

  const configPath = resolve(process.argv[2])
  let config

  try {
    // TODO: Check config correctness
    config = await import(configPath)
  } catch (err) {
    console.error('Could not load the configuration file', err)
    process.exit(1)
  }

  new Jukebox((config as any).default)
})()
