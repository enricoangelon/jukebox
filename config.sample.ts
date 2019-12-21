import { DevLogger } from '@jukebox/dev-logger'
import { FlatWorld } from '@jukebox/flat-world'

export default {
  worlds: [
    /* index 0 in the array will be the default world */
    new FlatWorld(/*{
      name: 'world',
      surfaceBlock: 'GRASS',
    }*/),
  ],
  logger: new DevLogger(/*{ saveToFile: false }*/),
  lang: 'en_US',
  filesystem: null, // Can optionally be in memory
  plugins: [],
  server: {
    port: 19132,
    motd: 'A jukebox minecraft bedrock server',
    maxPlayers: 20,
  },
}
