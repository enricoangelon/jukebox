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

  // Maybe extending packet is useless if is just used for functions
  // WTF is wrong with those protected variables? they are already declared in Packet class...
  public stream: BinaryStream
  static inputStream: BinaryStream
  static rinfo: RemoteInfo
  constructor(
    rinfo: RemoteInfo,
    inputStream: BinaryStream,
    stream: BinaryStream
  ) {
    super(rinfo, inputStream)
    this.inputStream = inputStream
    this.rinfo = rinfo
    this.stream = stream
  }

  //TODO: fix arg and class variables
  static fromBinary(stream: BinaryStream) {
    //this.rinfo, this.inputStream, this.stream should be right
    let packet = new Encapsulated(
      this.rinfo,
      this.inputStream,
      this.inputStream
    ) // third arg should be this.stream but it is not found in class so it'S the same like that

    let flags = stream.getByte()
    //let [reliability = packet.reliability, hasSplit = packet.hasSplit, length = packet.length] = [(flags & 0xe0) >> 5, (flags & 0x10) > 0, Math.ceil(stream.getShort() / 8)] //to check if it's correct, it must be
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
