import { parentPort } from 'worker_threads'

import { BinaryStream } from '@jukebox/binarystream'

import { WrapperPacket } from './minecraft/internal/wrapper-packet'

parentPort?.on('message', (data: { buffer: Uint8Array; offset: number }) => {
  const stream = new BinaryStream(Buffer.from(data.buffer))
  const wrapper = new WrapperPacket()
  wrapper.internalDecode(stream)
  parentPort?.postMessage(wrapper.getPackets())
})
