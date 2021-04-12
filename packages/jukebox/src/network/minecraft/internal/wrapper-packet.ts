import { Identifiers, Packet } from '@jukebox/raknet'
import { deflateRaw, deflateRawSync, inflateRaw, inflateRawSync } from 'zlib'

import { BinaryStream } from '@jukebox/binarystream'
import { DataPacket } from './data-packet'
import { assert } from 'console'
import { promisify } from 'util'

export class WrapperPacket extends Packet {
  private content = new BinaryStream()
  private compressionLevel = 7

  public constructor() {
    super(Identifiers.GAME_PACKET)
  }

  public encode(stream: BinaryStream): void {
    stream.write(
      deflateRawSync(this.content.getBuffer(), { level: this.compressionLevel })
    )
  }

  public decode(stream: BinaryStream): void {
    this.content.write(inflateRawSync(stream.getRemaining()))
  }

  private async asyncDecode(stream: BinaryStream): Promise<void> {
    const asyncInflateRaw = promisify(inflateRaw)
    const unzippedBuffer = await asyncInflateRaw(stream.getRemaining(), {
      level: this.compressionLevel,
    })
    this.content.write(unzippedBuffer)
  }

  // TODO: find a better compatible-way to do it
  public async internalAsyncDecode(stream: BinaryStream): Promise<Buffer[]> {
    this.decodeHeader(stream)
    await this.asyncDecode(stream)
    return this.getPackets()
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
