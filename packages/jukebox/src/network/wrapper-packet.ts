import { Identifiers, Packet } from '@jukebox/raknet'
import { deflateRawSync, inflateRawSync } from 'zlib'

import { BinaryStream } from '@jukebox/binarystream'
import { DataPacket } from './data-packet'
import { assert } from 'console'

export class WrapperPacket extends Packet {
  private content = new BinaryStream()

  public constructor() {
    super(Identifiers.GAME_PACKET)
  }

  public encode(stream: BinaryStream): void {
    stream.write(deflateRawSync(this.content.getBuffer()))
  }

  public decode(stream: BinaryStream): void {
    this.content.write(inflateRawSync(stream.getRemaining()))
  }

  public addPacket(dataPacket: DataPacket): void {
    assert(dataPacket.isEncoded() == false, 'DataPacket is already encoded')
    const buffer = dataPacket.internalEncode()
    this.content.writeUnsignedVarInt(buffer.byteLength)
    this.content.write(buffer)
  }

  public getPackets(): Array<Buffer> {
    const buffers: Array<Buffer> = []
    this.content.setOffset(0)
    do {
      const length = this.content.readUnsignedVarInt()
      const slice = this.content.read(length)
      buffers.push(slice)
    } while (!this.content.feof())
    return buffers
  }
}
