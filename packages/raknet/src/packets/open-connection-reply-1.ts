import { Packet, IPacket } from '../protocol/packet'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../protocol/identifiers'
import { RemoteInfo } from 'dgram'
import { Jukebox } from '@jukebox/core'

export default class OpenConnectionReply1 extends Packet implements IPacket {
  public static pid = Identifiers.ID_OPEN_CONNECTION_REQUEST_1

  public serverSecurity: number
  public mtuSize: number

  constructor(
    rinfo: RemoteInfo,
    inputStream: BinaryStream,
    stream?: BinaryStream
  ) {
    super(rinfo, inputStream, stream)

    // TODO: Verify that this should be 0 (https://wiki.vg/Pocket_Minecraft_Protocol#0x06)
    this.serverSecurity = 0
    this.mtuSize = this.inputStream.getShort()
  }

  encode() {
    this.stream.putByte(Identifiers.ID_OPEN_CONNECTION_REPLY_1)
    this.stream.putMagic()
    this.stream.putLong(Jukebox.serverID)
    this.stream.putShort(this.serverSecurity)
    this.stream.putShort(this.mtuSize)
  }
}
