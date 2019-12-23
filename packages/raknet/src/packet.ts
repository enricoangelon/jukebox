import { BinaryStream } from '@jukebox/binarystream'
import { RemoteInfo } from 'dgram'
import { Identifiers } from './identifiers'

export interface IPacketConstructor {
  new (
    rinfo: RemoteInfo,
    inputStream: BinaryStream,
    stream?: BinaryStream
  ): IPacket
}

export interface IPacket {
  decode?(): void
  encode(): void
  getBuffer(): Buffer
}

export class Packet {
  protected inputStream: BinaryStream
  protected stream: BinaryStream
  protected rinfo: RemoteInfo
  public static pid: number = Identifiers.ID_NOT_SET

  //USUAL PACKET FORMAT: xx 00 00 00 00 where xx is pid

  constructor(
    rinfo: RemoteInfo,
    inputStream: BinaryStream,
    stream?: BinaryStream
  ) {
    if (!stream) {
      stream = new BinaryStream()
    }

    this.inputStream = inputStream
    this.stream = stream
    this.rinfo = rinfo
  }

  public getBuffer(): Buffer {
    return this.stream.getBuffer()
  }
}

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
  public messageIndex: number = -1
  public orderIndex: number = -1
  public orderChannel: number = -1
  public splitCount: number = -1
  public splitId: number = -1
  public splitIndex: number = -1
  public lenght: number = 0
  public needAck: boolean = false
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
  static fromBinary(stream: BinaryStream) {
    //this.rinfo, this.inputStream, this.stream should be right
    let packet = new Encapsulated(
      this.rinfo,
      this.inputStream,
      this.inputStream
    ) //third arg should be this.stream but it is not found in class so it'S the same like that

    let flags = stream.getByte()
    packet.reliability = (flags & 0xe0) >> 5
    packet.hasSplit = (flags & 0x10) > 0

    packet.lenght = Math.ceil(stream.getShort() / 8)

    if (packet.isReliable()) {
      packet.messageIndex = stream.getLTriad()
    }

    if (packet.isSequenced()) {
      packet.orderIndex = stream.getLTriad()
      packet.orderChannel = stream.getByte()
    }

    if (packet.hasSplit) {
      packet.splitCount = stream.getInt()
      packet.splitId = stream.getShort()
      packet.splitIndex = stream.getInt()
    }

    packet.stream = new BinaryStream(
      stream.getBuffer().slice(stream.offset, stream.offset + packet.lenght)
    )
    stream.offset += packet.lenght

    return packet
  }

  toBinary() {
    let stream = new BinaryStream()

    stream.putByte((this.reliability << 5) | (this.hasSplit ? 0x10 : 0))
    stream.putShort(this.getBuffer().length << 3)

    if (this.isReliable()) {
      stream.putLTriad(this.messageIndex)
    }

    if (this.isSequenced()) {
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

  public isReliable() {
    return (
      this.reliability === Encapsulated.reliable ||
      this.reliability === Encapsulated.reliableOrdered ||
      this.reliability === Encapsulated.reliableSequenced ||
      this.reliability === Encapsulated.reliableWithAckReceipt ||
      this.reliability === Encapsulated.reliableOrderedWithAckReceipt
    )
  }

  public isSequenced() {
    return (
      this.reliability === Encapsulated.reliableOrdered ||
      this.reliability === Encapsulated.reliableOrderedWithAckReceipt
    )
  }
}

export class Datagram extends Packet {
  public headerFlags: number = -1
  public packetPair: boolean = false
  public continuousSend: boolean = false
  public needsBAndAs: boolean = false
  public sequenceNumber: number = 0
  public packets: Packet[] = []
  constructor(
    rinfo: RemoteInfo,
    inputStream: BinaryStream,
    stream?: BinaryStream
  ) {
    super(rinfo, inputStream, stream)
  }

  decode() {
    //decode header
    this.headerFlags = this.inputStream.getByte()
    this.packetPair = (this.headerFlags & 0x10) > 0
    this.continuousSend = (this.headerFlags & 0x08) > 0
    this.needsBAndAs = (this.headerFlags & 0x04) > 0

    //decode payload
    this.sequenceNumber = this.inputStream.getLTriad()
    while (!this.inputStream.feof()) {
      let packet = Encapsulated.fromBinary(this.inputStream)
      if (!(packet.getBuffer().length === 0)) {
        this.packets.push(packet)
      }
    }
  }

  encode() {
    //encode header
    this.stream.putByte(0x80 | 0) // to finish

    //encode payload
    this.stream.putLTriad(this.sequenceNumber)
    this.packets.forEach(packet => this.stream.append(packet.getBuffer()))
  }
}
