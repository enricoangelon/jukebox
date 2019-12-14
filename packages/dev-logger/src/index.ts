import { Logger } from '@jukebox/core'

export class DevLogger implements Logger {
  public info() {
    console.log(arguments)
  }
  public debug() {
    console.log(arguments)
  }
  public fatal() {
    console.log(arguments)
  }
  public log() {
    console.log(arguments)
  }
  public error() {
    console.log(arguments)
  }
  public trace() {
    console.log(arguments)
  }
  public warn() {
    console.log(arguments)
  }
  public namespace() {
    return new DevLogger()
  }
}
