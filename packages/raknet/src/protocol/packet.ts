import { BinaryStream } from '@jukebox/binarystream'
import { RemoteInfo } from 'dgram'

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
  public static pid: number = -129

  //USUAL PACKET FORMAT: xx 00 00 00 00 where xx is pid

  //Magic is sent to let the game know is a offline message

  constructor(
    rinfo: RemoteInfo,
    inputStream?: BinaryStream,
    stream?: BinaryStream
  ) {
    if (!stream) {
      stream = new BinaryStream()
    }

    if (!inputStream) {
      inputStream = new BinaryStream()
    }

    this.inputStream = inputStream
    this.stream = stream
    this.rinfo = rinfo
  }

  public getBuffer(): Buffer {
    return this.stream.getBuffer()
  }
}
