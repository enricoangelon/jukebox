import { Jukebox } from '@jukebox/core'
import { createSocket, RemoteInfo, Socket } from 'dgram'

export class UDPRakNetSocket {
  private static socket: Socket

  constructor() {
    UDPRakNetSocket.socket = createSocket('udp4').on('error', err => {
      Jukebox.getLogger().fatal(`Could not listen on :${port}`, err)
      UDPRakNetSocket.socket.close()
    })

    const { port } = Jukebox.getConfig().server
    UDPRakNetSocket.socket.bind(port, function() {
      Jukebox.getLogger().info(`Listening on :${port}.`)
    })

    UDPRakNetSocket.socket.on('message', function(
      msg: Buffer,
      rinfo: RemoteInfo
    ) {})
  }

  public static getSocket(): Socket {
    return UDPRakNetSocket.socket
  }

  public static sendBuffer(buffer: Buffer, port: number, address: string) {
    UDPRakNetSocket.socket.send(buffer, 0, buffer.length, port, address)
  }
}
