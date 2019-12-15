'use strict'
exports.__esModule = true
var dev_logger_1 = require('@jukebox/dev-logger')
var flat_world_1 = require('@jukebox/flat-world')
exports['default'] = {
  worlds: [
    /* index 0 in the array will be the default world */
    new flat_world_1.FlatWorld(/*{
          name: 'world',
          surfaceBlock: 'GRASS',
        }*/),
  ],
  logger: new dev_logger_1.DevLogger(/*{ saveToFile: false }*/),
  lang: 'en_US',
  filesystem: null,
  plugins: [],
  server: {
    port: 19132,
    motd: 'A jukebox minecraft bedrock server',
  },
}
