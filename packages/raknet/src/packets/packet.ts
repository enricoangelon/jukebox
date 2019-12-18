import { BinaryStream } from '@jukebox/binarystream'
import { IPacket } from './i-packet'

export class Packet implements IPacket {
  protected stream: BinaryStream
  public pid: number

  constructor(id: number, stream?: BinaryStream) {
    if (!stream) {
      stream = new BinaryStream()
    }

    this.stream = stream
    this.pid = id
  }

  decode(): void {
    throw new Error('Method not implemented.')
  }
  encode(): void {
    throw new Error('Method not implemented.')
  }

  public getBuffer(): Buffer {
    return this.stream.getBuffer()
  }
}
