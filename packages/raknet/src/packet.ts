import { BinaryStream } from '@jukebox/binarystream'
import { RemoteInfo } from 'dgram'
import { Identifiers } from './identifiers'

export interface IPacketConstructor {
  new (rinfo: RemoteInfo, stream?: BinaryStream): IPacket
}

export interface IPacket {
  decode?(): void
  encode(): void
  getBuffer(): Buffer
}

export class Packet {
  protected stream: BinaryStream
  protected rinfo: RemoteInfo
  public static pid: number = Identifiers.ID_NOT_SET

  //USUAL PACKET FORMAT: xx 00 00 00 00 where xx is pid

  constructor(rinfo: RemoteInfo, stream?: BinaryStream) {
    if (!stream) {
      stream = new BinaryStream()
    }

    this.stream = stream
    this.rinfo = rinfo
  }

  public getBuffer(): Buffer {
    return this.stream.getBuffer()
  }
}
