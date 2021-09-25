import assert from 'assert'

import { BinaryStream, WriteStream } from '@jukebox/binarystream'
import { Packet } from '@jukebox/raknet'

export abstract class DataPacket extends Packet {
  public constructor(id: number) {
    super(id)
  }

  // public internalEncode(stream = new BinaryStream()): Buffer {
  //  this.clean(stream)
  //  return super.internalEncode(stream)
  // }

  protected encodeHeader(stream: WriteStream): void {
    stream.writeUnsignedVarInt(this.getId())
  }

  public internalDecode(stream: BinaryStream): void {
    this.decodeHeader(stream)
    this.decode(stream)
    if (!stream.feof()) {
      const remaining = stream.getRemaining()
      throw new Error(
        `Still ${remaining.byteLength} unread bytes in ${this.constructor.name}: ${remaining}`
      )
    }
  }

  protected decodeHeader(stream: BinaryStream): void {
    const packetId = stream.readUnsignedVarInt()
    assert(
      packetId == this.getId(),
      `Datapacket ID mismatch during decoding got=${packetId}, expected=${this.getId()}`
    )
  }
}
