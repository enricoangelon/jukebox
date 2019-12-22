import { Packet, IPacket } from '../packet'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../identifiers'
import { RemoteInfo } from 'dgram'
import { Jukebox } from '@jukebox/core'

export default class UnconnectedPong extends Packet implements IPacket {
  public static pid = Identifiers.ID_UNCONNECTED_PONG

  public serverName: string
  public pingID: number
  public serverID: number

  constructor(rinfo: RemoteInfo, stream?: BinaryStream) {
    super(rinfo, stream)

    // configuration variables
    const { motd, maxPlayers } = Jukebox.getConfig().server

    this.serverName = `MCPE;${motd};389;1.14.1;0;${maxPlayers};${Jukebox.serverID};Jukebox;Creative`
    this.pingID = this.stream.getLong()
    this.serverID = Jukebox.serverID
  }

  encode() {
    this.stream.putByte(Identifiers.ID_UNCONNECTED_PONG)
    this.stream.putLong(this.pingID)
    this.stream.putLong(this.serverID)
    this.stream.putMagic()
    this.stream.putShort(this.serverName.length)
    this.stream.putString(this.serverName)
  }
}
