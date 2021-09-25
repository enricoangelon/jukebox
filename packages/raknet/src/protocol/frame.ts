import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { FrameFlags } from './frame-flags'
import { FrameReliability } from './frame-reliability'

// This is basically the utitliy to decode the message inside a datagram
// a datagram may contain multiple messages.
// This class is also known as EncapsulatedPacket.
export class Frame {
  public reliability = FrameReliability.UNRELIABLE

  // Only if reliable
  public reliableIndex: number
  // Only if sequenced
  public sequenceIndex: number
  // Only if ordered
  public orderedIndex: number
  public orderChannel = 0 // We don't support order channels
  // Only if fragmented
  public fragmentSize = 0
  // Refers to the ID of the fragmented packet
  public fragmentID: number
  // Refers to the index in the fragments array
  public fragmentIndex: number

  public content: Buffer

  public streamEncode(stream: WriteStream): void {
    let flags = this.reliability << 5
    if (this.fragmentSize > 0) {
      flags |= FrameFlags.SPLIT
    }
    stream.writeByte(flags)
    stream.writeUnsignedShort(this.content.byteLength * 8)

    if (this.isReliable()) {
      stream.writeTriadLE(this.reliableIndex)
    }

    if (this.isSequenced()) {
      stream.writeTriadLE(this.sequenceIndex)
    }

    if (this.isOrdered()) {
      stream.writeTriadLE(this.orderedIndex)
      stream.writeByte(this.orderChannel)
    }

    if (this.fragmentSize > 0) {
      stream.writeUnsignedInt(this.fragmentSize)
      stream.writeUnsignedShort(this.fragmentID)
      stream.writeUnsignedInt(this.fragmentIndex)
    }

    stream.write(this.content)
  }

  public streamDecode(stream: BinaryStream): void {
    const flags = stream.readByte()
    // The first 3 bits are the reliability type
    this.reliability = (flags & 224) >> 5
    // The last bit of the byte is the fragment flag
    const fragmented = (flags & FrameFlags.SPLIT) > 0
    const bitLength = stream.readUnsignedShort()

    if (this.isReliable()) {
      this.reliableIndex = stream.readTriadLE()
    }

    if (this.isSequenced()) {
      this.sequenceIndex = stream.readTriadLE()
    }

    if (this.isOrdered()) {
      this.orderedIndex = stream.readTriadLE()
      this.orderChannel = stream.readByte()
    }

    if (fragmented) {
      this.fragmentSize = stream.readUnsignedInt()
      this.fragmentID = stream.readUnsignedShort()
      this.fragmentIndex = stream.readUnsignedInt()
    }

    this.content = stream.read(bitLength / 8)
  }

  public isReliable(): boolean {
    return [
      FrameReliability.RELIABLE,
      FrameReliability.RELIABLE_ORDERED,
      FrameReliability.RELIABLE_SEQUENCED,
      FrameReliability.RELIABLE_WITH_ACK_RECEIPT,
      FrameReliability.RELIABLE_ORDERED_WITH_ACK_RECEIPT,
    ].includes(this.reliability)
  }

  public isSequenced(): boolean {
    return [
      FrameReliability.RELIABLE_SEQUENCED,
      FrameReliability.UNRELIABLE_SEQUENCED,
    ].includes(this.reliability)
  }

  public isOrdered(): boolean {
    return [
      FrameReliability.UNRELIABLE_SEQUENCED,
      FrameReliability.RELIABLE_ORDERED,
      FrameReliability.RELIABLE_SEQUENCED,
      FrameReliability.RELIABLE_ORDERED_WITH_ACK_RECEIPT,
    ].includes(this.reliability)
  }

  public getByteSize(): number {
    // 3 flags byte + bits length short (2 bytes)
    return (
      3 +
      (this.isReliable() ? 3 : 0) +
      (this.isSequenced() ? 3 : 0) +
      (this.isOrdered() ? 4 : 0) +
      (this.isFragmented() ? 10 : 0) +
      this.content.byteLength
    )
  }

  public isFragmented(): boolean {
    return this.fragmentSize > 0
  }
}
