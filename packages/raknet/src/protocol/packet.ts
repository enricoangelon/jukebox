import { BinaryStream } from '@jukebox/binarystream'
import { RemoteInfo } from 'dgram'
import { Identifiers } from './identifiers'

export interface IPacketConstructor {
  new (
    rinfo: RemoteInfo,
    inputStream: BinaryStream,
    stream?: BinaryStream
  ): IPacket
}

export interface IPacket {
  decode?(): void
  encode(): void
  getBuffer(): Buffer
}

export class Packet {
  protected inputStream: BinaryStream
  protected stream: BinaryStream
  protected rinfo: RemoteInfo
  public static pid: number = Identifiers.ID_NOT_SET

  //USUAL PACKET FORMAT: xx 00 00 00 00 where xx is pid

  constructor(
    rinfo: RemoteInfo,
    inputStream: BinaryStream,
    stream?: BinaryStream
  ) {
    if (!stream) {
      stream = new BinaryStream()
    }

    this.inputStream = inputStream
    this.stream = stream
    this.rinfo = rinfo
  }

  public getBuffer(): Buffer {
    return this.stream.getBuffer()
  }
}
