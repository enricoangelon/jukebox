import { Packet, IPacket } from '../packet'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from '../identifiers'
import { RemoteInfo } from 'dgram'
import { Jukebox } from '@jukebox/core'
import { RakNetSession } from '../session'

export default class OpenConnectionReply2 extends Packet implements IPacket {
  public static pid = Identifiers.ID_OPEN_CONNECTION_REQUEST_2

  public clientPort: number
  public mtuSize: number

  constructor(
    rinfo: RemoteInfo,
    inputStream: BinaryStream,
    stream?: BinaryStream
  ) {
    super(rinfo, inputStream, stream)

    this.clientPort = rinfo.port
    this.mtuSize = this.inputStream.getShort()
  }

  encode() {
    this.stream.putByte(Identifiers.ID_OPEN_CONNECTION_REPLY_2)
    this.stream.putMagic()
    this.stream.putLong(Jukebox.serverID)
    this.stream.putShort(this.clientPort)
    this.stream.putShort(this.mtuSize)
    this.stream.putByte(0) //serverSecurity

    // create client session
    RakNetSession.create(
      this.rinfo.address,
      this.rinfo.port,
      this.inputStream.getLong(),
      this.mtuSize
    )
  }
}