import { Jukebox } from '@jukebox/core'
import { IPacket, Packet } from './protocol/packet'
import { ConnectionRequestAccepted } from './packets/connection-request-accepted'
import { RemoteInfo } from 'dgram'
import { Socket } from './socket'
import { BinaryStream } from '@jukebox/binarystream'
import { Datagram } from './protocol/datagram'
import { Encapsulated } from './protocol/encapsulated'
import { PacketReliability } from './protocol/reliability'
import { Identifiers } from './protocol/identifiers'
import { ConnectedPing } from './packets/connected-ping'

export class RakNetSession {
  static readonly STATE_CONNECTING = 0
  static readonly STATE_CONNECTED = 1
  static readonly STATE_DISCONNECTING = 2
  static readonly STATE_DISCONNECTED = 3

  public static sessions: Map<string, RakNetSession> = new Map()
  private address: string
  private port: number
  private clientID: number
  private mtuSize: number
  private static startTime: number
  public state: number = RakNetSession.STATE_CONNECTING
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

    RakNetSession.startTime = Date.now()
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

  public static remove(session: RakNetSession, reason?: string) {
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

      for (let i = 0; i < packet.packets.length; ++i) {
        this.handleEncapsulated(rinfo, packet.packets[i])
      }
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
      let pk = new Encapsulated(
        rinfo,
        new BinaryStream(packet.getBuffer()),
        stream
      )
      pk.length = stream.offset

      this.handleEncapsulated(rinfo, pk)
    }
  }

  public handleEncapsulated(rinfo: RemoteInfo, packet: Encapsulated) {
    if (!(packet instanceof Encapsulated)) return
    let pid = packet.getBuffer()[0]
    Jukebox.getLogger().debug(
      `Recived EncapsulatedPacket with id ${pid} from ${this.address}!`
    )

    if (packet.hasSplit) {
      this.handleSplit(rinfo, packet)
      return
    }

    if (this.state === RakNetSession.STATE_CONNECTING) {
      if (pid === Identifiers.ID_CONNECTION_REQUEST) {
        let stream = new BinaryStream(packet.getBuffer())
        this.clientID = stream.getLong()
        let pk = new ConnectionRequestAccepted(rinfo, stream, undefined)

        pk.encode()

        let encodedPacket = new Encapsulated(
          rinfo,
          undefined,
          new BinaryStream(pk.getBuffer())
        )
        encodedPacket.reliability = PacketReliability.UNRELIABLE
        encodedPacket.orderChannel = 0

        let dgrampacket = new Datagram(rinfo)
        dgrampacket.packets.push(encodedPacket)
        dgrampacket.encode()

        Socket.sendBuffer(dgrampacket.getBuffer(), rinfo.port, rinfo.address)
      } else if (pid === Identifiers.ID_NEW_INCOMING_CONNECTION) {
        this.state = RakNetSession.STATE_CONNECTED

        let stream = new BinaryStream(packet.getBuffer())
        stream.getByte() // increase offset
        let address = stream.getAddress()

        if (address.port === Jukebox.getPort()) {
          // port checking todo (not important)
          Jukebox.getLogger().debug(
            `Successfully connected with ${this.address}:${this.port}`
          )
          this.state = RakNetSession.STATE_CONNECTED

          // open session

          this.sendPing(rinfo)
        }
      } else {
        Jukebox.getLogger().debug(`Got unhandled packet with id ${pid}`)
      }
    }
  }

  public sendPing(
    rinfo: RemoteInfo,
    reliability: number = PacketReliability.UNRELIABLE
  ) {
    let pk = new ConnectedPing(rinfo)
    pk.encode()
    Socket.sendBuffer(pk.getBuffer(), rinfo.port, rinfo.address)
  }

  public static getStartTime() {
    return Date.now() - this.startTime
  }
}
