import { Packet, IPacket } from '../protocol/packet'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../protocol/identifiers'
import { RemoteInfo } from 'dgram'
import { Jukebox } from '@jukebox/core'

export default class UnconnectedPong extends Packet implements IPacket {
  public static pid = Identifiers.ID_UNCONNECTED_PING

  public serverName: string
  public pingID: number

  constructor(
    rinfo: RemoteInfo,
    inputStream: BinaryStream,
    stream?: BinaryStream
  ) {
    super(rinfo, inputStream, stream)

    // configuration variables
    const { motd, maxPlayers } = Jukebox.getConfig().server

    this.serverName = `MCPE;${motd};389;1.14.1;0;${maxPlayers};${Jukebox.serverID};Jukebox;Creative`
    this.pingID = this.inputStream.getLong()
  }

  encode() {
    this.stream.putByte(Identifiers.ID_UNCONNECTED_PONG)
    this.stream.putLong(this.pingID)
    this.stream.putLong(Jukebox.serverID)
    this.stream.putMagic()
    this.stream.putShort(this.serverName.length)
    this.stream.putString(this.serverName)
  }
}
