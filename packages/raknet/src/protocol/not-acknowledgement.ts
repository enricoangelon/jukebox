import { RangedRecord, Record, SingleRecord } from '../record'

import { BinaryStream } from '@jukebox/binarystream'
import { Packet } from '../packet'

export class NotAcknowledgement extends Packet {
  public records: Set<Record>

  public constructor() {
    super(0xa0)
  }

  public encode(stream: BinaryStream): void {
    stream.writeShort(this.records.size)
    for (const record of this.records) {
      // May be tricky but i like this implementation
      stream.writeBoolean(record.isRanged())
      if (record.isRanged()) {
        stream.writeTriadLE((record as RangedRecord).getStartSeqNumber())
        stream.writeTriadLE((record as RangedRecord).getEndSeqNumber())
      } else {
        stream.writeTriadLE((record as SingleRecord).getSeqNumber())
      }
    }
  }

  public decode(stream: BinaryStream): void {}
}
