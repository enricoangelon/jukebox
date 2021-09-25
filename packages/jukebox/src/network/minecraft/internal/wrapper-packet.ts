import { deflateSync, inflate, inflateSync } from 'fflate'
import { deflateRaw } from 'pako'
import { deflateRaw as defr } from 'zlib'

import { BinaryStream, WriteStream } from '@jukebox/binarystream'
import { Identifiers, Packet } from '@jukebox/raknet'

import { DataPacket } from './data-packet'

export class WrapperPacket extends Packet {
  private content = new BinaryStream()
  // TODO: private compressionLevel = 7

  public constructor() {
    super(Identifiers.GAME_PACKET)
  }

  public encode(stream: WriteStream): void {
    stream.writeByteArray(deflateSync(this.content.getBuffer(), { level: 7 }))
  }

  public decode(stream: BinaryStream): void {
    this.content.write(inflateSync(stream.getRemaining()))
  }

  private async asyncEncode(stream: WriteStream): Promise<void> {
    const compressed = deflateRaw(this.content.getBuffer(), { level: 1 })
    stream.writeByteArray(compressed)
  }

  private async asyncDecode(stream: BinaryStream): Promise<void> {
    const decompressed: Uint8Array = await new Promise((resolve, reject) => {
      inflate(stream.getRemaining(), { consume: true }, (err, data) => {
        if (err) reject(err)
        resolve(data)
      })
    })
    this.content.write(decompressed)
  }

  public async internalAsyncEncode(
    stream = new WriteStream(Buffer.allocUnsafe(1024 * 1024 * 2))
  ): Promise<Buffer> {
    this.encodeHeader(stream)
    await this.asyncEncode(stream)
    this.encoded = true
    return stream.getBuffer()
  }

  public async internalAsyncDecode(stream: BinaryStream): Promise<Buffer[]> {
    this.decodeHeader(stream)
    await this.asyncDecode(stream)
    return this.getPackets()
  }

  public addPacket(dataPacket: DataPacket): void {
    const buffer = dataPacket.internalEncode(
      new WriteStream(Buffer.allocUnsafe(1024 * 1024 * 2))
    )
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
