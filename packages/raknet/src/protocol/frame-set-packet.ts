import { BinaryStream } from '@jukebox/binarystream'
import { Frame } from './frame'
import { FrameFlags } from './frame-flags'
import { Packet } from '../packet'
import { assert } from 'console'

// Represents the DatagramPacket
export class FrameSetPacket extends Packet {
  public sequenceNumber: number
  // Contains all the decoded (or to encode) messages
  public frames: Array<Frame> = []

  public constructor() {
    super(FrameFlags.VALID)
  }

  public encode(stream: BinaryStream): void {
    stream.writeTriadLE(this.sequenceNumber)
    for (const frame of this.frames) {
      frame.streamEncode(stream)
    }
  }

  protected decodeHeader(stream: BinaryStream): void {
    const id = stream.readByte()
    assert(id >= 0x80 && id <= 0x8f, {
      id: id,
      error: 'FrameSet identifier mismatch',
    })
  }

  public decode(stream: BinaryStream): void {
    this.sequenceNumber = stream.readTriadLE()
    do {
      const frame = new Frame()
      frame.streamDecode(stream)
      this.frames.push(frame)
    } while (!stream.feof())
  }
}
