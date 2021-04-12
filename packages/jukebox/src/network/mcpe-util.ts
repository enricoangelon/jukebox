import { BinaryStream } from '@jukebox/binarystream'

export class McpeUtil {
  public static readString(stream: BinaryStream): string {
    const length = stream.readUnsignedInt()
    return stream.read(length).toString('utf-8')
  }

  public static writeString(stream: BinaryStream, str: string): void {
    const buffer = Buffer.from(str, 'utf-8')
    stream.writeUnsignedVarInt(buffer.byteLength)
    stream.write(buffer)
  }

  public static readLELengthASCIIString(stream: BinaryStream): string {
    const strLen = stream.readIntLE()
    const str = stream.read(strLen).toString('ascii')
    return str
  }

  public static writeLELengthASCIIString(
    stream: BinaryStream,
    str: string
  ): void {
    // TODO: writeIntLE
  }
}
