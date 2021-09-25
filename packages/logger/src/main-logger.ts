import { Logger } from '.'

export class MainLogger implements Logger {
  // TODO
  public info(): void {
    console.log(arguments)
  }

  public debug(): void {}

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

  public warn(): void {}

  public namespace() {
    return new MainLogger()
  }
}
