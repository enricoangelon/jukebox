import { Packet } from './packet'
import { BinaryStream } from '@jukebox/binarystream'
import { RemoteInfo } from 'dgram'
import { Jukebox } from '@jukebox/core'
import { ReliabilityUtils } from './reliability/reliability-utils'

export class Encapsulated extends Packet {
  // need to find these values documentation, as i understand
  // those are the limits to see a packet as reliable
  static readonly RELIABILITY_SHIFT = 5
  static readonly RELIABILITY_FLAGS = 0xe0 // 0b111 << 5, decimal: 224

  static readonly SPLIT_FLAG = 0x10

  public reliability: number = 0
  public hasSplit: boolean = false
  public length: number = 0
  public messageIndex: number = -1
  public sequenceIndex: number = -1
  public orderIndex: number = -1
  public orderChannel: number = -1
  public splitCount: number = -1
  public splitId: number = -1
  public splitIndex: number = -1
  public needAck: boolean = false

  public static fromBinary(
    stream: BinaryStream,
    rinfo: RemoteInfo
  ): Encapsulated {
    let [packet, flags] = [new Encapsulated(rinfo, stream), stream.getByte()]

    let reliability = (packet.reliability =
      (flags & Encapsulated.RELIABILITY_FLAGS) >>
      Encapsulated.RELIABILITY_SHIFT)
    let hasSplit = (packet.hasSplit = (flags & Encapsulated.SPLIT_FLAG) > 0)
    let lenght = (packet.length = Math.ceil(stream.getShort() / 8))

    lenght === 0
      ? Jukebox.getLogger().error(
          'Got a empty Encapsulated payload from a packet'
        )
      : ''

    if (ReliabilityUtils.isReliable(reliability)) {
      packet.messageIndex = stream.getLTriad()
    }

    if (ReliabilityUtils.isSequenced(reliability)) {
      packet.sequenceIndex = stream.getLTriad()
    }

    if (ReliabilityUtils.isSequencedOrOrdered(reliability)) {
      packet.orderIndex = stream.getLTriad()
      packet.orderChannel = stream.getByte()
    }

    if (hasSplit) {
      packet.splitCount = stream.getInt()
      packet.splitId = stream.getShort()
      packet.splitIndex = stream.getInt()
    }

    packet.stream = new BinaryStream(
      stream.getBuffer().slice(stream.offset, stream.offset + packet.length)
    )
    stream.offset += packet.length

    return packet
  }

  public toBinary(): string {
    let stream = new BinaryStream()

    stream.putByte(
      (this.reliability << Encapsulated.RELIABILITY_SHIFT) |
        (this.hasSplit ? Encapsulated.SPLIT_FLAG : 0)
    )
    stream.putShort(this.getBuffer().length << 3)

    if (ReliabilityUtils.isReliable(this.reliability)) {
      stream.putLTriad(this.messageIndex)
    }

    if (ReliabilityUtils.isSequenced(this.reliability)) {
      stream.putLTriad(this.sequenceIndex)
    }

    if (ReliabilityUtils.isSequencedOrOrdered(this.reliability)) {
      stream.putLTriad(this.orderIndex)
      stream.putByte(this.orderChannel)
    }

    if (this.hasSplit) {
      stream.putInt(this.splitCount)
      stream.putShort(this.splitId)
      stream.putInt(this.splitIndex)
    }
    stream.append(this.getBuffer())

    return stream.getBuffer().toString('hex')
  }
}
