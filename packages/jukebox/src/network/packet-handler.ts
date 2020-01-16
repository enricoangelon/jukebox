import { RemoteInfo } from 'dgram'
import { Batched } from './protocol/batched'
import { BinaryStream } from '@jukebox/binarystream'

export class PacketHandler {
  public handleBatched(rinfo: RemoteInfo, packet: BinaryStream) {
    let batched = new Batched()
    batched.setBuffer(packet.getBuffer())
    batched.decode()
    batched.handle(rinfo, this)
  }
}
