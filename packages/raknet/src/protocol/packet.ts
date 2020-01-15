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
  public pid: number = -1

  //USUAL PACKET FORMAT: xx 00 00 00 00 where xx is pid

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

  // we have to move like this instead of doing things manually

  public encodeHeader() {
    this.stream.putByte(this.pid)
  }

  public decodeHeader() {
    this.stream.getByte()
  }

  public encode() {
    this.encodeHeader()
  }

  public decode() {
    this.decodeHeader()
  }

  public getBuffer(): Buffer {
    return this.stream.getBuffer()
  }
}
