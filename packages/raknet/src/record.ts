export interface Record {
  isSingle(): boolean
}

export class RangedRecord implements Record {
  private readonly startSequenceNumber: number
  private readonly endSequenceNumber: number

  public constructor(start: number, end: number) {
    this.startSequenceNumber = start
    this.endSequenceNumber = end
  }

  public getStartSeqNumber(): number {
    return this.startSequenceNumber
  }

  public getEndSeqNumber(): number {
    return this.endSequenceNumber
  }

  public isSingle(): boolean {
    return false
  }
}

export class SingleRecord implements Record {
  private sequenceNumber

  public constructor(sequenceNumber: number) {
    this.sequenceNumber = sequenceNumber
  }

  public getSeqNumber(): number {
    return this.sequenceNumber
  }

  public isSingle(): boolean {
    return true
  }
}
