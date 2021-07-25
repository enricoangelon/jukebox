import assert from 'assert'
import { BinaryStream } from '../../../binarystream/lib'

export class UUID {
  private parts: Array<number> = []
  private version: number

  public constructor(part1 = 0, part2 = 0, part3 = 0, part4 = 0, version = 4) {
    assert(version == 4, `Unimplemented UUID version ${version}`)
    this.parts = [part1, part2, part3, part4]
    this.version = version
  }

  public equals(uuid: UUID): boolean {
    return (
      this.parts.length == uuid.parts.length &&
      this.parts.every((value, index) => value == uuid.parts[index])
    )
  }

  public getParts(): Array<number> {
    return this.parts
  }

  public getVersion(): number {
    return this.version
  }

  public static fromString(uuid: string, version = 4): UUID {
    assert(uuid.length > 0, 'UUID value is not valid')
    return UUID.fromBinary(
      Buffer.from(uuid.trim().replace(/-/g, ''), 'hex'),
      version
    )
  }

  public static fromBinary(uuid: Buffer, version = 4): UUID {
    assert(uuid.byteLength == 16, 'UUID must have 16 bytes')
    const stream = new BinaryStream(uuid)
    return new UUID(
      stream.readInt(),
      stream.readInt(),
      stream.readInt(),
      stream.readInt(),
      version
    )
  }
}
