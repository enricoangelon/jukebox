import { Socket } from 'dgram'
import TextColors from '../../jukebox/src/utils/text-colors'

export class UDPRakNetInterface {
  private readonly socket: Socket

  //port can be custom by config
  constructor(port: number) {
    //TODO: output errors with logger instance
    this.socket = new Socket().on('error', err => {
      console.log(err.message)
      this.socket.close()
    })

    this.socket.bind(port, function() {
      console.log(`${TextColors.BLUE} Socket bind on: 0.0.0.0:${port}.`)
    })
  }
}
