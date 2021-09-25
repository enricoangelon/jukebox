import { parse } from 'comment-json'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

import { BinaryStream } from '@jukebox/binarystream'

import {
  Endianess,
  NBTDefinitions,
  NBTReader,
  NBTTagCompound,
  NBTWriter,
} from '../../../nbt/lib'
import { NBTTag } from '../../../nbt/lib/tag'
import { BlockState } from '../block/internal/block-state'
import { BlockStateContainer } from '../block/internal/block-state-container'

interface BiomeFileFormat {
  format_version: string
  'minecraft:biome': {
    description: { identifier: string }
    components: {
      'minecraft:climate': { downfall: number; temperature: number }
      animal?: {}
      beach?: {}
      birch?: {}
      bee_habitat?: {}
      bamboo?: {}
      cold?: {}
      deep?: {}
      desert?: {}
      edge?: {}
      extreme_hills?: {}
      frozen?: {}
      flower_forest?: {}
      forest?: {}
      hills?: {}
      ice?: {}
      ice_plains?: {}
      jungle?: {}
      lukewarm?: {}
      monster?: {}
      mountain?: {}
      mesa?: {}
      overworld_generation?: {}
      mutated?: {}
      ocean?: {}
      overworld?: {}
      rare?: {}
      taiga?: {}
      warm?: {}
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

  public static computeBlockStates(): Set<BlockStateContainer> {
    const vanillaBlocksFile = readFileSync(
      join(this.resourcesPath, 'blockstates', 'canonical_block_states.nbt')
    )

    const states: Set<BlockStateContainer> = new Set()

    const stream = new BinaryStream(vanillaBlocksFile)
    const reader = new NBTReader(stream, Endianess.LITTLE_ENDIAN)
    reader.setUseVarints(true)

    // Needs to be increased for every state
    // Every state represents something like a block id + meta
    let runtimeId = 0

    do {
      const vanillaBlock = reader.parse()
      const vanillaBlockName = vanillaBlock.getString('name', 'unknown')

      const stateContainer = {} as BlockStateContainer
      stateContainer.name = vanillaBlockName

      const vanillaBlockStates = vanillaBlock.getCompound('states', false)
      if (vanillaBlockStates == null) {
        throw new Error(`Vanilla block=${vanillaBlockName} has no states`)
      }

      const blockStates: Set<BlockState> = new Set()
      for (const [name, tag] of vanillaBlockStates.entries()) {
        blockStates.add({ name, nbt: tag } as BlockState)
      }
      stateContainer.states = blockStates
      stateContainer.runtimeId = runtimeId++

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
      const biomeJsonFile = parse(biomeRawFile) as BiomeFileFormat
      const biomeData = biomeJsonFile['minecraft:biome']
      const biomeClimateData = biomeData.components['minecraft:climate']

      const biomeName = biomeData.description.identifier
      const biomeNbt = new NBTTagCompound(biomeName)
      biomeNbt.addValue('ash', new NBTTag(NBTDefinitions.TAG_FLOAT, 0)) // unknown, parsed from BDS
      biomeNbt.addValue('blue_spores', new NBTTag(NBTDefinitions.TAG_FLOAT, 0)) // unknown, parsed from BDS
      biomeNbt.addValue(
        'downfall',
        new NBTTag(NBTDefinitions.TAG_FLOAT, biomeClimateData.downfall)
      )

      ///// CLIMATE /////
      const climateNBT = new NBTTagCompound('minecraft:climate')
      climateNBT.addValue('ash', new NBTTag(NBTDefinitions.TAG_FLOAT, 0)) // unknown, parsed from BDS
      climateNBT.addValue(
        'blue_spores',
        new NBTTag(NBTDefinitions.TAG_FLOAT, 0)
      ) // unknown, parsed from BDS
      climateNBT.addValue(
        'downfall',
        new NBTTag(NBTDefinitions.TAG_FLOAT, biomeClimateData.downfall)
      )
      climateNBT.addValue('red_spores', new NBTTag(NBTDefinitions.TAG_FLOAT, 0)) // unknown, parsed from BDS
      climateNBT.addValue(
        'temperature',
        new NBTTag(NBTDefinitions.TAG_FLOAT, biomeClimateData.temperature)
      )
      climateNBT.addValue('white_ash', new NBTTag(NBTDefinitions.TAG_FLOAT, 0)) // unknown, parsed from BDS
      ////////////////

      biomeNbt.addChild(climateNBT)

      // TODO: reverse engeener world generation

      biomeNbt.addValue('blue_spores', new NBTTag(NBTDefinitions.TAG_FLOAT, 0)) // unknown, parsed from BDS

      ///// TAGS /////
      const tags: Set<NBTTag<string>> = new Set()
      if (biomeData.components.animal) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'animal'))
      }

      if (biomeData.components.bamboo) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'bamboo'))
      }

      if (biomeData.components.beach) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'beach'))
      }

      if (biomeData.components.bee_habitat) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'bee_habitat'))
      }

      if (biomeData.components.birch) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'birch'))
      }

      if (biomeData.components.cold) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'cold'))
      }

      if (biomeData.components.deep) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'deep'))
      }

      if (biomeData.components.desert) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'desert'))
      }

      if (biomeData.components.edge) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'edge'))
      }

      if (biomeData.components.extreme_hills) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'extreme_hills'))
      }

      if (biomeData.components.flower_forest) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'flower_forest'))
      }

      if (biomeData.components.forest) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'forest'))
      }

      if (biomeData.components.frozen) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'frozen'))
      }

      if (biomeData.components.hills) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'hills'))
      }

      if (biomeData.components.ice) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'ice'))
      }

      if (biomeData.components.ice_plains) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'ice_plains'))
      }

      if (biomeData.components.jungle) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'jungle'))
      }

      if (biomeData.components.lukewarm) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'lukewarm'))
      }

      if (biomeData.components.mesa) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'mesa'))
      }

      if (biomeData.components.monster) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'monster'))
      }

      if (biomeData.components.mountain) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'mountain'))
      }

      if (biomeData.components.mutated) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'mutated'))
      }

      if (biomeData.components.ocean) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'ocean'))
      }

      if (biomeData.components.overworld) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'overworld'))
      }

      if (biomeData.components.overworld_generation) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'overworld_generation'))
      }

      if (biomeData.components.rare) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'rare'))
      }

      if (biomeData.components.taiga) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'taiga'))
      }

      if (biomeData.components.warm) {
        tags.add(new NBTTag(NBTDefinitions.TAG_STRING, 'warm'))
      }
      ////////////////

      // TODO: figure out why doesn't work
      // biomeNbt.addValue('tags', tags)
      biomeNbt.addValue(
        'temperature',
        new NBTTag(NBTDefinitions.TAG_FLOAT, biomeClimateData.temperature)
      )
      biomeNbt.addValue('white_ash', new NBTTag(NBTDefinitions.TAG_FLOAT, 0)) // unknown, parsed from BDS
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
