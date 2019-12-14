import { Config } from './config'

export class Jukebox {
  private static instance: Jukebox
  private config: Required<Config>

  constructor(config: Required<Config>) {
    if (Jukebox.instance) {
      config.logger.fatal(
        'Attempted to start the server twice on a single node process.'
      )
    }

    Jukebox.instance = this
    // TODO: config should be loaded, not provided
    this.config = config

    this.start()
  }

  public start() {
    // TODO: Implement bootstrapping
  }

  public shutdown() {
    // TODO: implement shutdown
  }

  public getConfig(): Required<Config> {
    return this.config
  }
}
