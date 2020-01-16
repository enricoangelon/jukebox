import { Datagram } from './datagram'
import { BinaryStream } from '@jukebox/binarystream'
import { Jukebox } from '../../jukebox'
import * as Zlib from 'zlib' // https://github.com/nodeca/pako
import { PacketHandler } from '../packet-handler'
import { RemoteInfo } from 'dgram'

export class Batched extends Datagram {
  public pid: number = 0xfe

  public allowBatching: boolean = false
  public allowBeforeLogin: boolean = true
  protected compressionLevel: number = 7

  public payload = new BinaryStream()

  public decodeHeader() {
    let decodedPID = this.getInt()
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

  public handle(rinfo: RemoteInfo, packetHandler: PacketHandler) {
    // make a packet pool or something
    // to create packet by packet id, so get packet class
    // and set to packet class the buffer given
    let pid = this.getBuffer()[0]

    Jukebox.getLogger().debug(`GOT BATCHED: ${pid}`)
  }
}
