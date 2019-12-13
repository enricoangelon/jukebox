import { Config } from './config'
import { UDPRakNetInterface } from '../../raknet/src/UDPRakNetInterface'

export class Jukebox {
  private static instance: Jukebox
  private readonly config: Required<Config>

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
    let int = new UDPRakNetInterface(19132)
    //TODO: interface that starts SessionsManager and RakNet packet listening.
    //TODO: SessionManager will handle packets per session.
  }

  public shutdown() {
    // TODO: implement shutdown
  }

  public getConfig(): Required<Config> {
    return this.config
  }
}
