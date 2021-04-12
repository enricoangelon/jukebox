import { NetEvents, NetworkSession, RakServer } from '@jukebox/raknet'

import { BinaryStream } from '@jukebox/binarystream'
import { Config } from './config'
import { Encryption } from './encryption'
import { Logger } from '@jukebox/logger'
import { PacketRegistry } from './network/packet-registry'
import { PlayerConnection } from './network/player-connection'
import { RemoteInfo } from 'dgram'
import { resolve } from 'path'

export class Jukebox {
  private static instance: Jukebox
  private server: RakServer
  private config: Required<Config>
  private connections: Map<RemoteInfo, PlayerConnection> = new Map()
  private encryption: Encryption | null = null

  public constructor(config: Required<Config>) {
    this.config = config
    if (Jukebox.instance) {
      Jukebox.getLogger().fatal(
        'Attempted to start the server twice on a single node process.'
      )
    }

    Jukebox.instance = this
    this.start()
  }

  public start(): void {
    Jukebox.getLogger().info(
      'Starting Jukebox server for Minecraft bedrock edition...'
    )

    this.server = new RakServer(
      Jukebox.getConfig().server.port ?? 19132,
      Jukebox.getConfig().server.maxPlayers ?? 20,
      Jukebox.getLogger()
    )

    // Init packet registry
    PacketRegistry.init()

    // Init encryption
    if (Jukebox.getConfig().encryption != false) {
      this.encryption = new Encryption()
      Jukebox.getLogger().info(
        `Encryption is enabled, preparing server keys...`
      )
    }

    // Start the actual server
    this.server.addListener(NetEvents.GAME_PACKET, this.handleRawNetwork)

    try {
      this.server.start()
    } catch (err) {
      Jukebox.getLogger().fatal(err)
    }

    // Tick connections every 1/20 seconds
    setInterval(() => {
      for (const conn of this.connections.values()) {
        // Timestamp in nanoseconds for debug purposes
        conn.process(process.hrtime()[1])
      }
    }, 50)
  }

  /**
   * Handles the raw packet buffer
   * received from the RakNet session.
   *
   * @param stream
   * @param session
   */
  private handleRawNetwork(
    stream: BinaryStream,
    session: NetworkSession
  ): void {
    const rinfo = session.getRemoteInfo()
    if (!Jukebox.instance.connections.has(rinfo)) {
      Jukebox.instance.connections.set(rinfo, new PlayerConnection(session))
    }

    const conn = Jukebox.instance.connections.get(rinfo)!
    conn.handleWrapper(stream)
  }

  public shutdown(): void {
    this.server.close()
    Jukebox.getLogger().info('Successfully closed the server socket!')

    // TODO: implement shutdown
  }

  public static getServer(): RakServer {
    return Jukebox.instance.server
  }

  public static getConfig(): Required<Config> {
    return Jukebox.instance.config
  }

  public static getLogger(): Logger {
    return Jukebox.instance.config.logger
  }

  public static getEncryption(): Encryption | null {
    return Jukebox.instance.encryption
  }
}

;(async () => {
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
