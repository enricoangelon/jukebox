import { Jukebox } from '@jukebox/core'

export class ServerName {
  private gameName: string = 'MCPE'
  private messageOfTheDay: string | undefined =
    typeof Jukebox !== 'undefined'
      ? Jukebox.getConfig().server.motd
      : 'No motd set in config'
  private gameProtocol: number = 389 //TODO in jukebox
  private gameVersion: string = '1.14.1' //TODO in jukebox
  private onlinePlayers: number = 0 //TODO a server method in future
  private maxPlayers: number | undefined =
    typeof Jukebox !== 'undefined' ? Jukebox.getConfig().server.maxPlayers : 20
  private serverID: number =
    typeof Jukebox !== 'undefined'
      ? Jukebox.serverID
      : Math.floor(Math.random() * 99999999 + 1)
  private softwareName: string = 'Jukebox'
  private gameMode: string | undefined =
    typeof Jukebox !== 'undefined'
      ? Jukebox.getConfig().server.gameMode
      : 'Creative'

  //TODO make user friendly functions to change data (not important now)

  public getName(): string {
    return `${this.gameName};${this.messageOfTheDay};${this.gameProtocol};${this.gameVersion};${this.onlinePlayers};${this.maxPlayers};${this.serverID};${this.softwareName};${this.gameMode}`
  }
}
