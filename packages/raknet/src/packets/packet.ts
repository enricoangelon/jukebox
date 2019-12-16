import { BinaryStream } from '@jukebox/binarystream'

export class Packet {
  public stream: BinaryStream
  public pid: number

  constructor(id: number, stream?: BinaryStream) {
    if (!stream) {
      stream = new BinaryStream()
    }

    this.stream = stream
    this.pid = id
  }

  public decode() {}

  public encode() {}
}
