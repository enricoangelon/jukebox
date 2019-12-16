import { Jukebox } from '@jukebox/core'
import { createSocket, RemoteInfo, Socket as DSocket } from 'dgram'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from './identifiers'
import { UnconnectedPong } from './packets/unconnected-pong'

export class Socket {
  private static socket: DSocket

  constructor() {
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
      switch (pid) {
        case Identifiers.ID_UNCONNECTED_PING:
          let packet = new UnconnectedPong()
          packet.pingID = buffer.getLong()
          packet.serverID = Math.floor(Math.random() * 99999999 + 1)
          Jukebox.getLogger().debug(packet.pingID, packet.serverID)
          packet.encode()
          Socket.sendBuffer(
            packet.stream.getBuffer(),
            rinfo.port,
            rinfo.address
          )
          Jukebox.getLogger().debug('UnconnectedPong handled!')
          break
        case Identifiers.ID_OPEN_CONNECTION_REQUEST_1:
          //praticamente, da questo pacchetto viene creata una sessione per il client
          break
      }
    })
  }

  public static getSocket(): Socket {
    return Socket.socket
  }

  public static sendBuffer(buffer: Buffer, port: number, address: string) {
    Socket.socket.send(buffer, 0, buffer.length, port, address)
  }
}
