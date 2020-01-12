import { Identifiers } from '../protocol/identifiers'

export class ServerName {
  private jukebox: any //i cant import jukebox or i get undefined class

  constructor(jukebox: any) {
    this.jukebox = jukebox
  }

  /*
  TypeError: Cannot read property 'getConfig' of undefined (when i import it using imports) so i made constructor
  Luca pls fix it for me :/
  */

  private gameName: string = 'MCPE'
  private messageOfTheDay: string | undefined =
    /*typeof Jukebox.getConfig().server.motd !== 'undefined' ? Jukebox.getConfig().server.motd : */ 'No motd set in config'
  private gameProtocol: number = Identifiers.GAME_PROTOCOL
  private gameVersion: string = Identifiers.GAME_VERSION
  private onlinePlayers: number = 0 //TODO a server method in future
  private maxPlayers:
    | number
    | undefined = /*typeof Jukebox.getConfig().server.maxPlayers !== 'undefined' ? Jukebox.getConfig().server.maxPlayers : */ 20
  private serverID: number = Math.floor(Math.random() * 99999999 + 1) //TODO from jukebox
  private softwareName: string = 'Jukebox'
  private gameMode: string | undefined =
    /*typeof Jukebox.getConfig().server.gameMode !== 'undefined' ? Jukebox.getConfig().server.gameMode : */ 'Creative'

  //TODO make user friendly functions to change data (not important now)

  public getServerName(): string {
    return `${this.gameName};${this.messageOfTheDay};${this.gameProtocol};${this.gameVersion};${this.onlinePlayers};${this.maxPlayers};${this.serverID};${this.softwareName};${this.gameMode}`
  }
}
