import { Logger } from '@jukebox/logger'
import { ServerConfig } from './server-config'
import { WorldGenerator } from './world-generator'

export interface Config {
  logger?: Logger
  server?: ServerConfig
  worlds?: WorldGenerator[]
  lang?: string
  encryption?: boolean
}
