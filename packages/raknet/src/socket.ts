import { Jukebox } from '@jukebox/core'
import { createSocket, RemoteInfo, Socket as DSocket } from 'dgram'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from './identifiers'
import { UnconnectedPong } from './packets/unconnected-pong'
import { OpenConnectionReply1 } from './packets/open-connection-reply-1'
import { OpenConnectionReply2 } from './packets/open-connection-reply-2'

export class Socket {
  private static socket: DSocket
  //private static packetsList: Map<number, Object>

  constructor() {
    /*
    NOT WORKING
    let packetsDirectory = __dirname + '/packets'
    const files = readdirSync(packetsDirectory)
    files.forEach(packetFile => {
      if (packetFile == 'i-packet.js' || packetFile == 'packet,js') return
      let packet = new(require(packetsDirectory + '/' + packetFile))
      if (!packet.pid) return
      Socket.packetsList.set(packet.pid, packet)
      Jukebox.getLogger().debug(Socket.packetsList.entries)
    })*/
    //Socket.packetsList = new Map()
    //Socket.packetsList.set(new UnconnectedPong().pid, UnconnectedPong)
    //console.log(Object.entries(Socket.packetsList))

    Socket.socket = createSocket('udp4').on('error', err => {
      Jukebox.getLogger().fatal(`Could not listen on :${port}`, err)
      Socket.socket.close()
    })

    const { port } = Jukebox.getConfig().server
    Socket.socket.bind(port, function() {
      Jukebox.getLogger().info(`Listening on :${port}.`)
    })

    Socket.socket.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
      let [buffer, pid] = [new BinaryStream(msg), msg[0]] //pid can also be buffer.readByte()
      Jukebox.getLogger().debug(
        `Recived a packet from ${rinfo.address}:${rinfo.port} with id: ${pid} and lentgh of ${msg.length}!`
      )

      //Those packets don't need a session
      //TODO: something like: Identifiers.get(pid).encode()
      const { motd, maxPlayers } = Jukebox.getConfig().server
      let packet
      switch (pid) {
        case Identifiers.ID_UNCONNECTED_PING:
          packet = new UnconnectedPong()
          packet.serverName = `MCPE;${motd};389;1.14.1;0;${maxPlayers};${Jukebox.getServerID()};Jukebox;Creative`
          packet.pingID = buffer.getLong()
          packet.serverID = Jukebox.getServerID()
          packet.encode()
          Socket.sendBuffer(packet.getBuffer(), rinfo.port, rinfo.address)
          break
        case Identifiers.ID_OPEN_CONNECTION_REQUEST_1:
          packet = new OpenConnectionReply1()
          packet.serverID = Jukebox.getServerID()
          packet.serverSecurity = 0 //always 0 as https://wiki.vg/Pocket_Minecraft_Protocol#0x06
          packet.mtuSize = buffer.getShort()
          packet.encode()
          Socket.sendBuffer(packet.getBuffer(), rinfo.port, rinfo.address)
          break
        case Identifiers.ID_OPEN_CONNECTION_REQUEST_2:
          packet = new OpenConnectionReply2()
          packet.serverID = Jukebox.getServerID()
          packet.clientPort = rinfo.port
          packet.mtuSize = buffer.getShort()
          packet.encode()
          Socket.sendBuffer(packet.getBuffer(), rinfo.port, rinfo.address)
      }
    })
  }

  public static getSocket(): Socket {
    return Socket.socket
  }

  //public static getPacketsList(): Map<number, Object> {
  //return this.packetsList
  //}

  public static sendBuffer(buffer: Buffer, port: number, address: string) {
    Socket.socket.send(buffer, 0, buffer.length, port, address)
  }
}
