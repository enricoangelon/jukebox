import { BinaryStream } from '@jukebox/binarystream'
import { Packet } from '@jukebox/raknet'
import { assert } from 'console'

export abstract class DataPacket extends Packet {
  public constructor(id: number) {
    super(id)
  }

  protected encodeHeader(stream: BinaryStream): void {
    stream.writeUnsignedVarInt(this.getId())
  }

  protected decodeHeader(stream: BinaryStream): void {
    const packetId = stream.readUnsignedVarInt()
    assert(packetId == this.getId(), 'Datapacket ID mismatch during decoding')
  }
}
