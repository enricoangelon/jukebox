import { Jukebox } from '@jukebox/core'
import { createSocket, RemoteInfo, Socket as DSocket } from 'dgram'
import { BinaryStream } from '@jukebox/binarystream'
import { Identifiers } from './identifiers'
import { PassThrough } from 'stream'

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

      //se fixi errore lo starto e testo se riceve pacchetti con id giusto
      // l'errore e' fixato, fai watch e dovrebbe andare
      //buono ora starto
      //async senza session e' inutile
      //Those packets don't need a session
      switch (pid) {
        case Identifiers.ID_UNCONNECTED_PING:
          //todo: prepare buffer to handle this packet
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
