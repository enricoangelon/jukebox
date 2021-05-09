import { readFileSync, readdirSync } from 'fs'

import {
  Endianess,
  NBTDefinitions,
  NBTReader,
  NBTTagCompound,
  NBTWriter,
} from '../../../nbt/lib'
import { join } from 'path'
import { parse } from 'comment-json'
import { NBTTag } from '../../../nbt/lib/tag'
import { BinaryStream } from '@jukebox/binarystream'
import { BlockStateContainer } from '../block/internal/block-state-container'
import { BlockState } from '../block/internal/block-state'
import legacyIds from './blockstates/block_id_map.json'
import { Jukebox } from '../jukebox'

interface BiomeFileFormat {
  format_version: string
  'minecraft:biome': {
    description: { identifier: string }
    components: {
      'minecraft:climate': { downfall: number; temperature: number }
    }
  }
}

export class ResourceManager {
  private static resourcesPath: string
  private static cachedBiomesNBT: Buffer

  public static init(): void {
    this.resourcesPath = join(__dirname, '..', 'resources')
    this.cachedBiomesNBT = this.computeBiomesNBT()
  }

  // TODO: remake as legacyIds are not supported anymore, instead
  // better to use namespaces with their default state
  public static computeBlockStates(): Set<BlockStateContainer> {
    const vanillaBlocksFile = readFileSync(
      join(this.resourcesPath, 'blockstates', 'canonical_block_states.nbt')
    )

    const states: Set<BlockStateContainer> = new Set()

    const stream = new BinaryStream(vanillaBlocksFile)
    const reader = new NBTReader(stream, Endianess.LITTLE_ENDIAN)
    reader.setUseVarints(true)

    // Needs to be increased for every state
    let runtimeId = 0
    // Holds how many times we find the same block
    // The meta will refer to the unique block with its unique states
    const metaCounter: Map<string, number> = new Map()
    do {
      const vanillaBlock = reader.parse()
      const vanillaBlockName = vanillaBlock.getString('name', 'unknown')

      if (!metaCounter.has(vanillaBlockName)) {
        metaCounter.set(vanillaBlockName, 0)
      } else {
        const meta = metaCounter.get(vanillaBlockName)!
        metaCounter.set(vanillaBlockName, meta + 1)
      }

      if (!Object.keys(legacyIds).includes(vanillaBlockName)) {
        Jukebox.getLogger().debug(
          `Legacy id mapping not found for block=${vanillaBlockName}`
        )
        continue
      }

      const vanillaBlockStates = vanillaBlock.getCompound('states', false)
      if (vanillaBlockStates == null) {
        throw new Error(`Vanilla block=${vanillaBlockName} has no states`)
      }

      const stateContainer = <BlockStateContainer>{}
      stateContainer.name = vanillaBlockName
      stateContainer.legacyId = (legacyIds as any)[vanillaBlockName]

      const blockStates: Set<BlockState> = new Set()
      for (const [name, tag] of vanillaBlockStates.entries()) {
        blockStates.add(<BlockState>{ name, nbt: tag })
      }
      stateContainer.states = blockStates

      stateContainer.runtimeId = runtimeId++
      const meta = metaCounter.get(vanillaBlockName)!

      stateContainer.meta = meta
      states.add(stateContainer)
    } while (!stream.feof())

    return states
  }

  private static computeBiomesNBT(): Buffer {
    // Those files are from BDS
    const biomeFilesPath = join(this.resourcesPath, 'definitions', 'biomes')
    const biomeFiles = readdirSync(biomeFilesPath)

    const biomesNbt = new NBTTagCompound()
    for (const biomeFileName of biomeFiles) {
      const biomeRawFile = readFileSync(
        join(biomeFilesPath, biomeFileName)
      ).toString()
      const biomeJsonFile = <BiomeFileFormat>parse(biomeRawFile)
      const biomeData = biomeJsonFile['minecraft:biome']
      const biomeClimateData = biomeData.components['minecraft:climate']

      const biomeName = biomeData.description.identifier
      const biomeNbt = new NBTTagCompound(biomeName)
      biomeNbt.addValue(
        'downfall',
        new NBTTag(NBTDefinitions.TAG_FLOAT, biomeClimateData.downfall)
      )
      biomeNbt.addValue(
        'temperature',
        new NBTTag(NBTDefinitions.TAG_FLOAT, biomeClimateData.temperature)
      )
      biomesNbt.addChild(biomeNbt)
    }

    const stream = new BinaryStream()
    const writer = new NBTWriter(stream, Endianess.LITTLE_ENDIAN)
    writer.setUseVarint(true)
    writer.writeCompound(biomesNbt)
    return stream.getBuffer()
  }

  public static getBiomesNBTBuffer(): Buffer {
    return this.cachedBiomesNBT
  }
}
