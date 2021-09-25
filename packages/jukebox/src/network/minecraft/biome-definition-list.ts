import { BinaryStream, WriteStream } from '@jukebox/binarystream'

import { ResourceManager } from '../../resources/resource-manager'
import { Protocol } from '../protocol'
import { DataPacket } from './internal/data-packet'

export class McpeBiomeDefinitionList extends DataPacket {
  public constructor() {
    super(Protocol.BIOME_DEFINITION_LIST)
  }

  public encode(stream: WriteStream): void {
    stream.write(ResourceManager.getBiomesNBTBuffer())
  }

  public decode(): void {
    throw new Error('Unsupported operation')
  }
}
