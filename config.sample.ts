import { DevLogger, MainLogger } from '@jukebox/logger'

export default {
  defaultWorld: 'world',
  logger: new MainLogger(/*{ saveToFile: false }*/),
  lang: 'en_US',
  filesystem: null, // Can optionally be in memory
  plugins: [],
  encryption: false,
  server: {
    port: 19132,
    motd: 'A jukebox minecraft bedrock server',
    maxPlayers: 20,
  },
}
