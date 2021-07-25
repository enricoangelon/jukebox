import { DevLogger } from '@jukebox/logger'
import { FlatWorld } from '@jukebox/flat-world'
import { Config } from '@jukebox/core'

export default <Config>{
  worlds: [
    /* index 0 in the array will be the default world */
    new FlatWorld(/*{
      name: 'world',
      surfaceBlock: 'GRASS',
    }*/),
  ],
  defaultWorld: 'world',
  logger: new DevLogger(/*{ saveToFile: false }*/),
  lang: 'en_US',
  filesystem: null, // Can optionally be in memory
  plugins: [],
  encryption: true,
  server: {
    port: 19132,
    motd: 'A jukebox minecraft bedrock server',
    maxPlayers: 20,
  },
}
