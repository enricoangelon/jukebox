import { Jukebox } from '@jukebox/core'

export class InternetAddress {
  public address: string
  public port: number
  public version: number

  constructor(address: string, port: number, version: number) {
    this.address = address
    this.port = port
    if (port < 0 || port > 65535) {
      Jukebox.getLogger().error(`Invalied InternetAddress port: ${port}`)
    }
    this.version = version
  }
}
