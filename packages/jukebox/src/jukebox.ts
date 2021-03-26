import { Config } from './config'
import { Logger } from '@jukebox/logger'
import { RakServer } from '@jukebox/raknet'
import { resolve } from 'path'

export class Jukebox {
  private static instance: Jukebox
  private server: RakServer
  private config: Required<Config>

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

    try {
      this.server.start()
    } catch (err) {
      Jukebox.getLogger().fatal(err)
    }

    // TODO: Implement bootstrapping
  }

  public shutdown(): void {
    this.server.close()
    // this.server.close(() => {
    //  Jukebox.getLogger().info('Successfully closed the server socket!')
    // })

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
