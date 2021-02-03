import { Socket as DSocket, RemoteInfo, createSocket } from 'dgram'

import { BinaryStream } from '@jukebox/binarystream'
import { EventEmitter } from 'events'
import { Identifiers } from './identifiers'

export class Socket extends EventEmitter {
  private static socket: DSocket

  constructor(port: number) {
    super()

    Socket.socket = createSocket('udp4').on('error', err => {
      throw err
    })

    Socket.socket.bind(port, () => {
      this.emit('listening')
    })

    Socket.socket.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
      let [buffer, pid] = [new BinaryStream(msg), msg[0]] // pid can also be buffer.readByte()
      // We will never have to log on raknet, so this will be removed soon
      console.log(
        `Recived a packet from ${rinfo.address}:${rinfo.port} with id: ${pid} and lentgh of ${msg.length}!`
      )

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
