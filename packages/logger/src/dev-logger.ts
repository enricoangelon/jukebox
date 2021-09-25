import { Logger } from './logger'

export class DevLogger implements Logger {
  public info(): void {
    console.log(arguments)
  }

  public debug(): void {
    console.log(arguments)
  }

  public fatal(): void {
    console.log(arguments)
  }

  public log(): void {
    console.log(arguments)
  }

  public error(): void {
    console.log(arguments)
  }

  public trace(): void {
    console.log(arguments)
  }

  public warn(): void {
    console.log(arguments)
  }

  public namespace() {
    return new DevLogger()
  }
}
