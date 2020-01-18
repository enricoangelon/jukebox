import { Datagram } from './datagram'
import { BinaryStream } from '@jukebox/binarystream'
import { Jukebox } from '../../jukebox'
import * as Zlib from 'zlib' // https://github.com/nodeca/pako
import { PacketHandler } from '../packet-handler'
import { RemoteInfo } from 'dgram'

export class Batched extends Datagram {
  public pid: number = 0xfe // MCPE Wrapper

  public allowBatching: boolean = false
  public allowBeforeLogin: boolean = true
  protected compressionLevel: number = 7

  public payload = new BinaryStream()

  public decodeHeader() {
    let decodedPID = this.getByte()
    if (decodedPID !== this.pid) {
      Jukebox.getLogger().error(
        `Got a packet with wrong PID, expecting: ${this.pid}, got: ${decodedPID}!`
      )
    }
  }

  public decodePayload() {
    let packedData = this.getRemaining()
    this.payload = new BinaryStream(Zlib.unzipSync(packedData))
  }

  public encodeHeader() {
    this.putByte(this.pid)
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
