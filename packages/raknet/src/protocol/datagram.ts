import { Packet } from './packet'
import { RemoteInfo } from 'dgram'
import { BinaryStream } from '@jukebox/binarystream'
import { Encapsulated } from './encapsulated'

export class Datagram extends Packet {
  /* BitFlags */
  static readonly BITFLAG_VALID = 0x80 //is it a good practise?
  static readonly BITFLAG_ACK = 0x40
  static readonly BITFLAG_NAK = 0x20

  //Those flags are ignored by the client but they can be set to a dgram packet
  static readonly BITFLAG_PACKET_PAIR = 0x10
  static readonly BITFLAG_CONTINUOUS_SEND = 0x08
  static readonly BITFLAG_NEEDS_B_AND_AS = 0x04

  public headerFlags: number = 0
  public seqNumber: number = 0 //used to retrive the packet if lost
  public packets: Encapsulated[] = []
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

    //decode payload
    this.seqNumber = this.inputStream.getLTriad()

    while (!this.inputStream.feof()) {
      let packet = Encapsulated.fromBinary(this.inputStream)
      if (!(packet.getBuffer().length === 0)) {
        this.packets.push(packet)
      }
    }
  }

  encode() {
    //encode header
    this.stream.putByte(Datagram.BITFLAG_VALID | this.headerFlags)

    //encode payload
    this.stream.putLTriad(this.seqNumber)
    //https://stackoverflow.com/questions/5349425/whats-the-fastest-way-to-loop-through-an-array-in-javascript
    //prefix vs postfix increment? prefixs seems to be faster than
    for (let i = 0; i < this.packets.length; ++i) {
      this.stream.append(
        this.packets[i] instanceof Encapsulated
          ? this.packets[i].toBinary()
          : this.packets[i]
      )
    }
    //forEach is slow... waiting for Luca: this.packets.forEach(packet => this.stream.append(packet))
  }
}
