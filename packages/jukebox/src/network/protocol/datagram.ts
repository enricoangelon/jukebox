import { BinaryStream } from '@jukebox/binarystream'
import { Jukebox } from '../../jukebox'

export class Datagram extends BinaryStream {
  // we can do it in raknet too, would be better
  public pid: number = -129

  public allowBatching: boolean = true
  public allowBeforeLogin: boolean = false
  public mayHaveUnreadBytes: boolean = false

  // private encoded: boolean = false

  public getName(): string {
    return this.constructor.name // any other way?
  }

  public decodePayload() {}

  public decodeHeader() {
    // need to make hack for pid, i need public and static access
    let decodedPID = this.getUnsignedVarInt()
    if (decodedPID !== this.pid) {
      Jukebox.getLogger().error(
        `Got a packet with wrong PID, expecting: ${this.pid}, got: ${decodedPID}!`
      )
    }
  }

  public decode() {
    this.decodeHeader()
    this.decodePayload()
  }

  public encodePayload() {}

  public encodeHeader() {
    this.putUnsignedVarInt(this.pid)
  }

  public encode() {
    this.encodeHeader()
    this.encodePayload()
  }
}
