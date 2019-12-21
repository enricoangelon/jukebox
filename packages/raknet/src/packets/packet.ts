import { BinaryStream } from '@jukebox/binarystream'

export class Packet {
  protected stream: BinaryStream
  public pid: number

  //USUAL PACKET FORMAT: xx 00 00 00 00 where xx is pid

  constructor(id: number, stream?: BinaryStream) {
    if (!stream) {
      stream = new BinaryStream()
    }

    this.stream = stream
    this.pid = id
  }

  public getBuffer(): Buffer {
    return this.stream.getBuffer()
  }
}
