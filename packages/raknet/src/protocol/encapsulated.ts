import { Packet } from './packet'
import { BinaryStream } from '@jukebox/binarystream'
import { RemoteInfo } from 'dgram'
import { Reliability } from './reliability'

export class Encapsulated extends Packet {
  static readonly unreliable = 0
  static readonly unreliable_sequenced = 1
  static readonly reliable = 2
  static readonly reliableOrdered = 3
  static readonly reliableSequenced = 4
  static readonly unreliableWithAckReceipt = 5
  static readonly reliableWithAckReceipt = 6
  static readonly reliableOrderedWithAckReceipt = 7

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

  public static fromBinary(stream: BinaryStream, rinfo: RemoteInfo) {
    let packet = new Encapsulated(rinfo, stream)

    let flags = stream.getByte()

    packet.reliability = (flags & 0xe0) >> 5
    packet.hasSplit = (flags & 0x10) > 0
    packet.length = Math.ceil(stream.getShort() / 8)

    if (packet.reliability > Reliability.UNRELIABLE) {
      if (Reliability.isReliable(packet.reliability)) {
        packet.messageIndex = stream.getLTriad()
      }

      if (Reliability.isSequenced(packet.reliability)) {
        packet.sequenceIndex = stream.getLTriad()
      }

      if (Reliability.isSequencedOrOrdered(packet.reliability)) {
        packet.orderIndex = stream.getLTriad()
        packet.orderChannel = stream.getByte()
      }
    }

    if (packet.hasSplit) {
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

  toBinary() {
    let stream = new BinaryStream()

    stream.putByte((this.reliability << 5) | (this.hasSplit ? 0x10 : 0))
    stream.putShort(this.getBuffer().length << 3)

    if (this.reliability > Reliability.UNRELIABLE) {
      if (Reliability.isReliable(this.reliability)) {
        stream.putLTriad(this.messageIndex)
      }

      if (Reliability.isSequenced(this.reliability)) {
        stream.putLTriad(this.sequenceIndex)
      }

      if (Reliability.isSequencedOrOrdered(this.reliability)) {
        stream.putLTriad(this.orderIndex)
        stream.putByte(this.orderChannel)
      }

      if (this.hasSplit) {
        stream.putInt(this.splitCount)
        stream.putShort(this.splitId)
        stream.putInt(this.splitIndex)
      }
    }

    stream.append(this.getBuffer())

    return stream.getBuffer().toString('hex')
  }
}
