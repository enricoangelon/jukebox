import { Packet } from './packet'
import { Encapsulated } from './encapsulated'

export class Datagram extends Packet {
  /* Packet BitFlags */
  static readonly BITFLAG_VALID = 0x80
  static readonly BITFLAG_ACK = 0x40
  static readonly BITFLAG_NAK = 0x20

  //Those flags are ignored by the client but they can be set to a dgram packet
  static readonly BITFLAG_PACKET_PAIR = 0x10
  static readonly BITFLAG_CONTINUOUS_SEND = 0x08
  static readonly BITFLAG_NEEDS_B_AND_AS = 0x04

  public headerFlags: number = 0
  public seqNumber: number = 0 //used to retrive the packet if lost
  public packets: Encapsulated[] = []

  public decode() {
    //decode header
    this.headerFlags = this.inputStream.getByte()

    //decode payload
    this.seqNumber = this.inputStream.getLTriad()

    while (!this.inputStream.feof()) {
      let packet = Encapsulated.fromBinary(this.inputStream, this.rinfo)
      if (!(packet.getBuffer().length === 0)) {
        this.packets.push(packet)
      }
    }
  }

  public encode() {
    //encode header
    this.stream.putByte(Datagram.BITFLAG_VALID | this.headerFlags)

    //encode payload
    this.stream.putLTriad(this.seqNumber)
    for (let i = 0; i < this.packets.length; ++i) {
      this.stream.append(this.packets[i].toBinary())
    }
  }
}
