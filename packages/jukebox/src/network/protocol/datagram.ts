import { BinaryStream } from '@jukebox/binarystream'

import { Jukebox } from '../../jukebox'
import { PacketHandler } from '../packet-handler'

export class Datagram extends BinaryStream {
  public static readonly NETWORK_ID: number = 0x00

  public allowBatching: boolean = true
  public allowBeforeLogin: boolean = false
  public mayHaveUnreadBytes: boolean = false

  public encoded: boolean = false

  public getPacketID(): number {
    return (this.constructor as typeof Datagram).NETWORK_ID
  }

  public getName(): string {
    return this.constructor.name
  }

  public decodePayload() {}

  protected decodeHeader() {
    // need to make hack for pid, i need public and static access
    let [decodedPID, Pid] = [this.getUnsignedVarInt(), this.getPacketID()]
    if (decodedPID !== Pid) {
      Jukebox.getLogger().error(
        `Got a packet with wrong PID, expecting: ${Pid}, got: ${decodedPID}!`
      )
    }
  }

  public decode() {
    this.offset = 0 // reset offset
    this.decodeHeader()
    this.decodePayload()
  }

  public encodePayload() {}

  protected encodeHeader() {
    this.putUnsignedVarInt(this.getPacketID())
  }

  public encode() {
    this.reset()
    this.encodeHeader()
    this.encodePayload()
    this.encoded = true // not sure why is needed
  }

  public handle(packetHandler: PacketHandler): boolean {
    return false
  }
}
