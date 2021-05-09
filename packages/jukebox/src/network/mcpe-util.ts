import { BehaviorPackInfo } from '../resourcepack/behavior-pack-info'
import { BinaryStream } from '@jukebox/binarystream'
import { ResourcePackInfo } from '../resourcepack/resource-pack-info'
import { ResourcePackStack } from '../resourcepack/resource-pack-stack'
import { Vector3 } from '../math/vector3'

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
    const buf = Buffer.from(str, 'ascii')
    stream.writeIntLE(buf.byteLength)
    stream.write(buf)
  }

  public static readVector3(stream: BinaryStream): Vector3 {
    const x = stream.readFloatLE()
    const y = stream.readFloatLE()
    const z = stream.readFloatLE()
    return new Vector3(x, y, z)
  }

  public static writeVector3(stream: BinaryStream, vector3: Vector3): void {
    stream.writeFloatLE(vector3.getX())
    stream.writeFloatLE(vector3.getY())
    stream.writeFloatLE(vector3.getZ())
  }

  public static readBlockCoords(stream: BinaryStream): Vector3 {
    const x = stream.readVarInt()
    const y = stream.readUnsignedVarInt()
    const z = stream.readVarInt()
    return new Vector3(x, y, z)
  }

  public static writeBlockCoords(stream: BinaryStream, vector3: Vector3): void {
    stream.writeVarInt(vector3.getX())
    stream.writeUnsignedVarInt(vector3.getY())
    stream.writeVarInt(vector3.getZ())
  }

  public static readResourcePackInfo(stream: BinaryStream): ResourcePackInfo {
    const uuid = McpeUtil.readString(stream)
    const version = McpeUtil.readString(stream)
    const size = stream.readLongLE()
    const contentKey = McpeUtil.readString(stream)
    const subPackName = McpeUtil.readString(stream)
    const contentIdentity = McpeUtil.readString(stream)
    const hasScripts = stream.readBoolean()
    const rtxEnabled = stream.readBoolean()
    return {
      uuid,
      version,
      size,
      contentKey,
      subPackName,
      contentIdentity,
      hasScripts,
      rtxEnabled,
    }
  }

  public static writeResourcePackInfo(
    stream: BinaryStream,
    info: ResourcePackInfo
  ): void {
    McpeUtil.writeString(stream, info.uuid)
    McpeUtil.writeString(stream, info.version)
    stream.writeLongLE(info.size)
    McpeUtil.writeString(stream, info.contentKey)
    McpeUtil.writeString(stream, info.subPackName)
    McpeUtil.writeString(stream, info.contentIdentity)
    stream.writeBoolean(info.hasScripts)
    stream.writeBoolean(info.rtxEnabled)
  }

  public static readBehaviorPackInfo(stream: BinaryStream): BehaviorPackInfo {
    const uuid = McpeUtil.readString(stream)
    const version = McpeUtil.readString(stream)
    const size = stream.readLongLE()
    const contentKey = McpeUtil.readString(stream)
    const subPackName = McpeUtil.readString(stream)
    const contentIdentity = McpeUtil.readString(stream)
    const hasScripts = stream.readBoolean()
    return {
      uuid,
      version,
      size,
      contentKey,
      subPackName,
      contentIdentity,
      hasScripts,
    }
  }

  public static writeBehaviorPackInfo(
    stream: BinaryStream,
    info: BehaviorPackInfo
  ): void {
    McpeUtil.writeString(stream, info.uuid)
    McpeUtil.writeString(stream, info.version)
    stream.writeLongLE(info.size)
    McpeUtil.writeString(stream, info.contentKey)
    McpeUtil.writeString(stream, info.subPackName)
    McpeUtil.writeString(stream, info.contentIdentity)
    stream.writeBoolean(info.hasScripts)
  }

  public static readResourcePackStack(stream: BinaryStream): ResourcePackStack {
    const uuid = McpeUtil.readString(stream)
    const version = McpeUtil.readString(stream)
    const subPackName = McpeUtil.readString(stream)
    return { uuid, version, subPackName }
  }

  public static writeResourcePackStack(
    stream: BinaryStream,
    stack: ResourcePackStack
  ): void {
    McpeUtil.writeString(stream, stack.uuid)
    McpeUtil.writeString(stream, stack.version)
    McpeUtil.writeString(stream, stack.subPackName)
  }
}
