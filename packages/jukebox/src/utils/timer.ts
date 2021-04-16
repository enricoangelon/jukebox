import { Jukebox } from '..'

export class Timer {
  private static timers: Map<string, [number, number]> = new Map()

  // May use something for partnership or unique identifiers for the future
  public static start(identifier: string): void {
    if (this.timers.has(identifier)) {
      Jukebox.getLogger().error(`Timer ${identifier} is already started!`)
      return
    }

    // Save the time as nanoseconds
    this.timers.set(identifier, process.hrtime())
  }

  public static stop(identifier: string): void {
    if (!this.timers.has(identifier)) {
      Jukebox.getLogger().error(
        `Timer ${identifier} not found, cannot be stopped!`
      )
      return
    }

    const startNs = this.timers.get(identifier)!
    this.timers.delete(identifier)
    const elapsedNs = process.hrtime(startNs)
    // https://nodejs.org/api/process.html#process_process_hrtime_time
    Jukebox.getLogger().debug(
      `Timer ${identifier} took ${
        elapsedNs[0] * 1e9 + elapsedNs[1]
      } nanoseconds`
    )
  }
}
