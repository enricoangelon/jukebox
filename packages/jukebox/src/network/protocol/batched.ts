import { BinaryStream } from '@jukebox/binarystream'
import * as Zlib from 'zlib'

import { Datagram } from './datagram'
import { Jukebox } from '../../jukebox'
import { PacketHandler } from '../packet-handler'

export class Batched extends Datagram {
  public static readonly NETWORK_ID: number = 0xfe // MCPE Wrapper

  public allowBatching: boolean = false
  public allowBeforeLogin: boolean = true
  protected compressionLevel: number = 7

  public payload = new BinaryStream()

  public addPacket(packet: Datagram | Batched) {
    if (!packet.allowBatching) {
      Jukebox.getLogger().error(`${packet.getName()} can't be batched!`)
    }

    if (!packet.encoded) {
      packet.encode()
    }

    this.payload.putUnsignedVarInt(packet.getBuffer().length)
    this.payload.append(packet.getBuffer())
  }

  public decodeHeader() {
    let [decodedPID, Pid] = [this.getByte(), this.getPacketID()]
    if (decodedPID !== Pid) {
      Jukebox.getLogger().error(
        `Got a packet with wrong PID, expecting: ${Pid}, got: ${decodedPID}!`
      )
    }
  }

  public decodePayload() {
    let packedData = this.getRemaining()
    this.payload = new BinaryStream(Zlib.unzipSync(packedData))
  }

  public encodeHeader() {
    this.putByte(this.getPacketID())
  }

  public encodePayload() {
    let packedData = Zlib.deflateSync(this.payload.getBuffer(), {
      level: this.compressionLevel,
    })
    this.append(packedData)
  }

  public handle(packetHandler: PacketHandler): boolean {
    if (this.payload.getBuffer().length == 0) {
      return false // not handled if empty payload
    }

    let pkBuffer = this.payload.get(this.payload.getUnsignedVarInt()) // must be one packet / time
    let pid = pkBuffer[0]

    // get packet and set buffer to it
    let pk = Jukebox.packetPool.get(pid)

    if (pk instanceof Datagram) {
      if (!pk.allowBatching) {
        Jukebox.getLogger().error(`Invalid batched packet: ${pk.getName()}`)
      }

      pk.setBuffer(pkBuffer)
      packetHandler.handleDatagram(pk)
    }

    return true
  }
}
