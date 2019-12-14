import { Config } from './config'
import { UDPRakNetSocket } from '@jukebox/raknet'
import { resolve } from 'path'

export class Jukebox {
  private static instance: Jukebox
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
    new UDPRakNetSocket()

    // TODO: Implement bootstrapping
  }

  public shutdown() {
    // TODO: implement shutdown
  }

  public static getConfig(): Required<Config> {
    return Jukebox.instance.config
  }

  public static getLogger() {
    return Jukebox.instance.config.logger
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
