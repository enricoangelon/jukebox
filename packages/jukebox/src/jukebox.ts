import { Config } from './config'
import { resolve } from 'path'
import { Logger } from './logger'
import { Socket } from '@jukebox/raknet'

export class Jukebox {
  private static instance: Jukebox
  private static readonly serverID: number = Math.floor(
    Math.random() * 99999999 + 1
  )
  private config: Required<Config>

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
    new Socket()

    // TODO: Implement bootstrapping
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

  public static getServerID(): number {
    return Jukebox.serverID
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
