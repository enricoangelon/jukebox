import { Jukebox } from '@jukebox/core'
import { IPacket, Packet, Datagram, Encapsulated } from './packet'
import { ConnectionRequestAccepted } from './packets/connection-request'
import { RemoteInfo } from 'dgram'
import { Socket } from './socket'
import { BinaryStream } from '@jukebox/binarystream'

export class RakNetSession {
  public static sessions: Map<string, RakNetSession> = new Map()
  private address: string
  private port: number
  private clientID: number
  private mtuSize: number
  private startTime: number
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
      `Created RakNet session for ${address} with MTU size ${mtuSize}`
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

  public close() {
    //TODO: check if player is disconnecting and send a message...
    Jukebox.getLogger().debug(`Closed RakNet session for ${this.address}`)
  }

  public handlePacket(rinfo: RemoteInfo, packet: IPacket) {
    if (packet instanceof Datagram) {
      packet.decode()

      //todo all stuff for packets loss

      packet.packets.forEach(pk => this.handleEncapsulatedPacket(rinfo, pk))
    }
  }

  public handleEncapsulatedPacket(rinfo: RemoteInfo, packet: Packet) {
    if (!(packet instanceof Encapsulated)) return
    let pid = packet.getBuffer()[0]
    Jukebox.getLogger().debug(
      `Recived EncapsulatedPacket with id ${pid} from ${this.address}!`
    )

    if (packet.hasSplit) {
      //todo handle splitted packet
      Jukebox.getLogger().debug('Need to handle split')
      return
    }

    //oh shit! here we go again...
    switch (pid) {
      case 0x09: //Connection request
        let pk = new ConnectionRequestAccepted(
          rinfo,
          packet.stream /*inputStream*/
        )
        this.clientID = packet.stream.getLong() //used to increase offset
        pk.sendPingTime = packet.stream.getLong()
        pk.sendPongTime = this.getStartTime()
        pk.encode()
        Jukebox.getLogger().debug('Connection Request')
        let encodedPacket = new Encapsulated(
          rinfo,
          new BinaryStream(pk.getBuffer())
        )
        encodedPacket.reliability = 0 //unreliable
        encodedPacket.orderChannel = 0
        Socket.sendBuffer(encodedPacket.getBuffer(), rinfo.port, rinfo.address)
        break
      case 0x13: //New Incoming Connection
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
