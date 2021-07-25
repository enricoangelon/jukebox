import { BehaviorPackInfo } from '../resourcepack/behavior-pack-info'
import { BinaryStream } from '@jukebox/binarystream'
import { ResourcePackInfo } from '../resourcepack/resource-pack-info'
import { ResourcePackStack } from '../resourcepack/resource-pack-stack'
import { Vector3 } from '../math/vector3'
import { UUID } from '../utils/uuid'
import { Skin } from '../utils/skin/skin'
import { SkinImage } from '../utils/skin/image'

export class McpeUtil {
  public static readString(stream: BinaryStream): string {
    const length = stream.readUnsignedVarInt()
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

  public static writeUUID(stream: BinaryStream, uuid: UUID): void {
    stream.writeIntLE(uuid.getParts()[1])
    stream.writeIntLE(uuid.getParts()[0])
    stream.writeIntLE(uuid.getParts()[3])
    stream.writeIntLE(uuid.getParts()[2])
  }

  public static readUUID(stream: BinaryStream): UUID {
    const part1 = stream.readIntLE()
    const part0 = stream.readIntLE()
    const part3 = stream.readIntLE()
    const part2 = stream.readIntLE()
    return new UUID(part0, part1, part2, part3)
  }

  public static writeSkinImage(stream: BinaryStream, image: SkinImage): void {
    stream.writeFloatLE(image.getWidth())
    stream.writeFloatLE(image.getHeight())
    stream.writeUnsignedVarInt(image.getData().byteLength)
    stream.write(image.getData())
  }

  // TODO: readSkinImage

  public static writeSkin(stream: BinaryStream, skin: Skin): void {
    McpeUtil.writeString(stream, skin.getIdentifier())
    McpeUtil.writeString(stream, skin.getPlayFabId())
    McpeUtil.writeString(stream, skin.getResourcePatch())
    McpeUtil.writeSkinImage(stream, skin.getImage())
    stream.writeIntLE(skin.getAnimations().length)
    for (const animation of skin.getAnimations()) {
      McpeUtil.writeSkinImage(stream, animation.getImage())
      stream.writeIntLE(animation.getType())
      stream.writeFloatLE(animation.getFrames())
      stream.writeIntLE(animation.getExpression())
    }
    McpeUtil.writeSkinImage(stream, skin.getCape().getImage())
    McpeUtil.writeString(stream, skin.getGeometry())
    McpeUtil.writeString(stream, skin.getAnimationData())
    stream.writeBoolean(skin.isPremium())
    stream.writeBoolean(skin.isPersona())
    stream.writeBoolean(skin.isCapeOnClassicSkin())
    McpeUtil.writeString(stream, skin.getCape().getIndetifier())
    McpeUtil.writeString(stream, skin.getFullId())
    McpeUtil.writeString(stream, skin.getArmSize())
    McpeUtil.writeString(stream, skin.getColor())
    if (skin.isPersona()) {
      stream.writeIntLE(skin.getPersonaData().getPieces().length)
      for (const personaPiece of skin.getPersonaData().getPieces()) {
        McpeUtil.writeString(stream, personaPiece.pieceId)
        McpeUtil.writeString(stream, personaPiece.pieceType)
        McpeUtil.writeString(stream, personaPiece.packId)
        stream.writeBoolean(personaPiece.default)
        McpeUtil.writeString(stream, personaPiece.productId)
      }
      stream.writeIntLE(skin.getPersonaData().getTintColors().length)
      for (const tint of skin.getPersonaData().getTintColors()) {
        McpeUtil.writeString(stream, tint.pieceType)
        stream.writeIntLE(tint.colors.length)
        for (const color of tint.colors) {
          McpeUtil.writeString(stream, color)
        }
      }
    } else {
      stream.writeIntLE(0)
      stream.writeIntLE(0)
    }
  }

  // TODO: readSkin
}
