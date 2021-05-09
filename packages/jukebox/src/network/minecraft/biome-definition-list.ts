import { BinaryStream } from '@jukebox/binarystream'
import { DataPacket } from './internal/data-packet'
import { Protocol } from '../protocol'
import { ResourceManager } from '../../resources/resource-manager'

export class McpeBiomeDefinitionList extends DataPacket {
  public constructor() {
    super(Protocol.BIOME_DEFINITION_LIST)
  }

  public encode(stream: BinaryStream): void {
    stream.write(ResourceManager.getBiomesNBTBuffer())
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
