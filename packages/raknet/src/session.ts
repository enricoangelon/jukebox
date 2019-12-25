import { Jukebox } from '@jukebox/core'
import { IPacket, Packet } from './protocol/packet'
import { ConnectionRequestAccepted } from './packets/connection-request-accepted'
import { RemoteInfo } from 'dgram'
import { Socket } from './socket'
import { BinaryStream } from '@jukebox/binarystream'
import { Datagram } from './protocol/datagram'
import { Encapsulated } from './protocol/encapsulated'

export class RakNetSession {
  /*
  UNUSED AT THE MOMENT. LEAVE IT THERE
  static readonly STATE_CONNECTING = 0
  static readonly STATE_CONNECTED = 1
  static readonly STATE_DISCONNECTING = 2
  static readonly STATE_DISCONNECTED = 3
  */

  public static sessions: Map<string, RakNetSession> = new Map()
  private address: string
  private port: number
  private clientID: number
  private mtuSize: number
  private startTime: number
  private splitPackets: Map<number, Map<number, Packet>> = new Map()
  constructor(
    address: string,
    port: number,
    clientID: number,
    mtuSize: number
  ) {
    this.address = address
    this.port = port
    this.clientID = clientID
    this.mtuSize = mtuSize

    this.startTime = Date.now()
  }
  static create(
    address: string,
    port: number,
    clientID: number,
    mtuSize: number
  ) {
    let session = new RakNetSession(address, port, clientID, mtuSize)
    RakNetSession.sessions.set(address, session)
    Jukebox.getLogger().debug(
      `Created RakNet session for ${address}:${port} with MTU size ${mtuSize}`
    )
    return session
  }

  static remove(session: RakNetSession, reason?: string) {
    let address = session.address
    if (RakNetSession.sessions.has(address)) {
      RakNetSession.sessions.get(address)!.close()
      RakNetSession.sessions.delete(address)
    }
  }

  static get(address: string) {
    //TODO: method to retrive session
  }

  public close() {
    //TODO: check if player is disconnecting and send a message...
    Jukebox.getLogger().debug(`Closed RakNet session for ${this.address}`)
  }

  public handlePacket(rinfo: RemoteInfo, packet: IPacket) {
    if (packet instanceof Datagram) {
      packet.decode()

      //todo all stuff for packets loss

      for (let i = 0; i < packet.packets.length; ++i) {
        this.handleEncapsulated(rinfo, packet.packets[i])
      }
      //forEach is slow... does luca approve? packet.packets.forEach(pk => this.handleEncapsulatedPacket(rinfo, pk))
    }
  }

  public handleSplit(rinfo: RemoteInfo, packet: Encapsulated) {
    if (
      packet.splitCount > 128 /* Max split size */ ||
      packet.splitIndex >= 128 ||
      packet.splitIndex < 0
    ) {
      Jukebox.getLogger().debug(`Got invalid split packet from ${this.address}`)
    }

    if (this.splitPackets.has(packet.splitId)) {
      let m = this.splitPackets.get(packet.splitId)
      if (!(typeof m === 'undefined')) {
        m.set(packet.splitIndex, packet)
        this.splitPackets.set(packet.splitId, m)
      }
    } else {
      if (this.splitPackets.size >= 4 /* max split count */) {
        Jukebox.getLogger().debug(
          `Split packet from ${this.address} ingored because reached the maximum split size of 4`
        )
        return
      }
      let m = new Map([[packet.splitIndex, packet]])
      this.splitPackets.set(packet.splitId, m)
    }
    let splits = this.splitPackets.get(packet.splitId)
    if (!(typeof splits === 'undefined') && splits.size === packet.splitCount) {
      let stream = new BinaryStream()
      for (let [, splitPacket] of splits) {
        stream.append(splitPacket.getBuffer())
      }
      stream.flip()
      let pk = new Encapsulated(rinfo, packet.stream, stream)
      pk.length = stream.offset

      this.handleEncapsulated(rinfo, pk)
    }
  }

  public handleEncapsulated(rinfo: RemoteInfo, packet: Packet) {
    if (!(packet instanceof Encapsulated)) return
    let pid = packet.getBuffer()[0]
    Jukebox.getLogger().debug(
      `Recived EncapsulatedPacket with id ${pid} from ${this.address}!`
    )

    if (packet.hasSplit) {
      this.handleSplit(rinfo, packet)
      return
    }

    //oh shit! here we go again...
    switch (pid) {
      case 0x09: //Connection request
        let pk = new ConnectionRequestAccepted(rinfo, packet.stream)
        this.clientID = packet.stream.getLong() //used to increase offset
        pk.sendPingTime = packet.stream.getLong()
        pk.sendPongTime = this.getStartTime()

        pk.encode()

        let encodedPacket = new Encapsulated(
          rinfo,
          new BinaryStream(pk.getBuffer()), //useless inputsream
          new BinaryStream(pk.getBuffer()) //used packet stream
        )
        encodedPacket.reliability = 0 //unreliable
        encodedPacket.orderChannel = 0

        let dgrampacket = new Datagram(
          rinfo,
          new BinaryStream(),
          new BinaryStream()
        )
        dgrampacket.packets.push(encodedPacket)
        dgrampacket.encode()

        console.log(dgrampacket.getBuffer())

        Socket.sendBuffer(dgrampacket.getBuffer(), rinfo.port, rinfo.address)
        break
      case 0x13: //New Incoming Connection
        // before i cleaned up code i was able to get this... i messed up everything but i cleaned code :P...
        // UPDATE: cleaned code again and checked, now everything works like charm
        Jukebox.getLogger().debug('New Incoming Connection')
        break
    }
  }

  getStartTime() {
    return Date.now() - this.startTime
  }

  private static checkQueue() {}
}

//;(async function() {
//process.nextTick()
//})()
