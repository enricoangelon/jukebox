import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { McpeUtil } from '../mcpe-util'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeText extends DataPacket {
  public type: number
  public needsTranslation: boolean

  public sourceName: string
  public message: string
  public parameters: Array<string> = []

  public xuid: string
  public platformChatId: string

  public constructor() {
    super(Protocol.TEXT)
  }

  public encode(stream: WriteStream): void {
    stream.writeByte(this.type)
    stream.writeBoolean(this.needsTranslation)

    switch (this.type) {
      case 0:
      case 1:
      case 2:
        McpeUtil.writeString(stream, this.sourceName)
      case 3:
      case 4:
      case 5:
        McpeUtil.writeString(stream, this.message)
        break
      case 6:
      case 7:
      case 8:
        McpeUtil.writeString(stream, this.message)
        stream.writeUnsignedVarInt(this.parameters.length)
        for (const parameter of this.parameters) {
          McpeUtil.writeString(stream, parameter)
        }
        break
    }

    McpeUtil.writeString(stream, this.xuid)
    McpeUtil.writeString(stream, this.platformChatId)
  }

  public decode(stream: BinaryStream): void {
    this.type = stream.readByte()
    this.needsTranslation = stream.readBoolean()

    switch (this.type) {
      case 0:
      case 1:
      case 2:
        this.sourceName = McpeUtil.readString(stream)
      case 3:
      case 4:
      case 5:
        this.message = McpeUtil.readString(stream)
        break
      case 6:
      case 7:
      case 8:
        this.message = McpeUtil.readString(stream)
        const length = stream.readUnsignedVarInt()
        for (let i = 0; i < length; i++) {
          this.parameters.push(McpeUtil.readString(stream))
        }
        break
    }

    this.xuid = McpeUtil.readString(stream)
    this.platformChatId = McpeUtil.readString(stream)
  }
}
