import { RangedRecord, Record, SingleRecord } from './record'

import { Acknowledgement } from './protocol/acknowledgement'
import { BinaryStream } from '@jukebox/binarystream'
import { ConnectedPing } from './protocol/connection/connected-ping'
import { ConnectedPong } from './protocol/connection/connected-pong'
import { ConnectionRequest } from './protocol/login/connection-request'
import { ConnectionRequestAccepted } from './protocol/login/connection-request-accepted'
import { Frame } from './protocol/frame'
import { FrameFlags } from './protocol/frame-flags'
import { FrameReliability } from './protocol/frame-reliability'
import { FrameSetPacket } from './protocol/frame-set-packet'
import { Identifiers } from './identifiers'
import { Info } from './info'
import { Logger } from '@jukebox/logger'
import { NetEvents } from './net-events'
import { NewIncomingConnection } from './protocol/connection/new-incoming-connection'
import { NotAcknowledgement } from './protocol/not-acknowledgement'
import { OpenConnectionReplyOne } from './protocol/connection/open-connection-reply-one'
import { OpenConnectionReplyTwo } from './protocol/connection/open-connection-reply-two'
import { OpenConnectionRequestOne } from './protocol/connection/open-connection-request-one'
import { OpenConnectionRequestTwo } from './protocol/connection/open-connection-request-two'
import { Packet } from './packet'
import { RakServer } from './server'
import { RemoteInfo } from 'dgram'
import { assert, time } from 'console'

export class NetworkSession {
  private readonly socket: RakServer
  private readonly rinfo: RemoteInfo
  private readonly logger: Logger

  // MaximumTransferUnit used to indetify
  // maximum buffer length we can send per packet
  private mtu: number

  // TODO: implement client timeout
  private receiveTimestamp: number

  // Holds the received sequence numbers
  private inputSequenceNumbers: Set<number> = new Set()
  // Holds the sent packets identified by their sequence numbers
  private outputFrameSets: Map<number, FrameSetPacket> = new Map()
  // Queue holding output frames
  private outputFramesQueue: Set<Frame> = new Set()
  // Holds the actual sequence number
  private outputSequenceNumber = 0
  // Holds the reliable index for reliable frame sets
  private outputReliableIndex = 0
  // Holds the sequence number of lost packets
  private nackSequenceNumbers: Set<number> = new Set()

  // Used by ordered reliable frame sets
  private orderingIndexes: Map<number, number> = new Map()
  // Input ordering queue
  private inputOrderIndex: Map<number, number> = new Map()
  private inputOrderingQueue: Map<number, Map<number, Frame>> = new Map()
  private highestSequenceIndex: Map<number, number> = new Map()
  // Used to identify split packets
  private fragmentID = 0

  // fragmentID -> FragmentedFrame ( index -> buffer )
  private fragmentedFrames: Map<number, Map<number, Frame>> = new Map()

  public constructor(socket: RakServer, rinfo: RemoteInfo, logger: Logger) {
    this.logger = logger
    this.socket = socket
    this.rinfo = rinfo

    this.socket.on(NetEvents.TICK, this.tick.bind(this))
  }

  public tick(timestamp: number): void {
    // Acknowledge recived packets to the other end
    if (this.inputSequenceNumbers.size > 0) {
      const records: Set<Record> = new Set()
      const sequences = Array.from(this.inputSequenceNumbers).sort(
        (a, b) => a - b
      )

      const deleteSeqFromInputQueue = (seqNum: number) => {
        if (!this.inputSequenceNumbers.has(seqNum)) {
          this.logger.debug(
            `Cannot find sequnece number (${seqNum}) in input queue`
          )
          return
        }
        this.inputSequenceNumbers.delete(seqNum)
      }

      for (let i = 1, continuous = 0; i <= sequences.length; i++) {
        const prevSeq = sequences[i - 1]
        // In the last iteration sequences[i] will be undefined, but it does its job correctly
        if (sequences[i] - prevSeq == 1) {
          continuous++
        } else {
          if (continuous == 0) {
            records.add(new SingleRecord(prevSeq))
            deleteSeqFromInputQueue(prevSeq)
          } else {
            const start = sequences[i - 1] - continuous
            records.add(new RangedRecord(start, prevSeq))

            for (let j = start; j < prevSeq; j++) {
              deleteSeqFromInputQueue(j)
            }
            continuous = 0
          }
        }
      }

      const ack = new Acknowledgement()
      ack.records = records
      this.sendPacket(ack)
    }

    // Not Acknowledge non received packets
    if (this.nackSequenceNumbers.size > 0) {
      this.logger.debug('We miss packets, send a NACK')
      if (this.nackSequenceNumbers.size == 1) {
        // Single sequence number
      } else {
        // Ranged sequence numbers
      }
    }

    // Send all queued frames and clear queue
    if (this.outputFramesQueue.size > 0) {
      const frameSet = new FrameSetPacket()
      frameSet.sequenceNumber = this.outputSequenceNumber++
      const frames = Array.from(this.outputFramesQueue)
      frameSet.frames = frames
      this.logger.debug(
        `Sent FrameSet with sequenceNumber=${frameSet.sequenceNumber} holding ${frameSet.frames.length} frame(s)`
      )
      this.sendFrameSet(frameSet)
      // Delete sent frames from output queue
      for (const frame of frames) {
        this.outputFramesQueue.delete(frame)
      }
    }
  }

  public async handle(stream: BinaryStream): Promise<void> {
    if (!(await this.handleDatagram(stream))) {
      const packetId = stream.getBuffer().readUInt8(0)
      if (packetId & FrameFlags.ACK) {
        this.handleAcknowledgement(stream)
      } else if (packetId & FrameFlags.NACK) {
        // Handle negative acknowledgement
        this.handleNacknowledgement(stream)
      } else {
        this.handleConnectedDatagram(stream)
      }
    }
  }

  private async handleDatagram(stream: BinaryStream): Promise<boolean> {
    // Used to timout the client if we don't receive new packets
    this.receiveTimestamp = Date.now()

    const packetId = stream.getBuffer().readUInt8(0)
    if (packetId == Identifiers.OPEN_CONNECTION_REQUEST_1) {
      await this.handleOpenConnectionRequestOne(stream)
      return true
    } else if (packetId == Identifiers.OPEN_CONNECTION_REQUEST_2) {
      await this.handleOpenConnectionRequestTwo(stream)
      return true
    }

    return false
  }

  private handleConnectedDatagram(stream: BinaryStream): void {
    const frameSetPacket = new FrameSetPacket()
    frameSetPacket.internalDecode(stream)

    // Every FrameSet contains a sequence number that is used
    // to retrive lost packets or to ignore duplicated ones

    // Ignore the packet if we already received it
    if (this.inputSequenceNumbers.has(frameSetPacket.sequenceNumber)) {
      this.logger.debug(
        `Discarded already received FrameSet with sequenceNumber=${frameSetPacket.sequenceNumber} from ${this.rinfo.address}:${this.rinfo.port}`
      )
      return
    }
    // Add into received ones if we didn't received it before
    this.inputSequenceNumbers.add(frameSetPacket.sequenceNumber)

    // Remove the sequence number from the lost ones if we received it now
    if (this.nackSequenceNumbers.has(frameSetPacket.sequenceNumber)) {
      this.nackSequenceNumbers.delete(frameSetPacket.sequenceNumber)
    }

    // Now we need to retrive missing sequence numbers
    const sequenceNumbers = Array.from(this.inputSequenceNumbers).sort(
      (a, b) => a - b
    )
    const [min, max] = [
      Math.min(...sequenceNumbers),
      Math.max(...sequenceNumbers),
    ]
    const missingSequenceNumbers = Array.from(
      Array(max - min),
      (_v, k) => k + min
    ).filter(k => !sequenceNumbers.includes(k))
    for (const missingSequenceNumber of missingSequenceNumbers) {
      this.nackSequenceNumbers.add(missingSequenceNumber)
    }

    for (const frame of frameSetPacket.frames) {
      this.processFrame(frame)
    }
  }

  private processFrame(frame: Frame): void {
    if (frame.isFragmented()) {
      this.logger.debug(
        `Recived a fragmented Frame fragmentSize=${frame.fragmentSize}, fragmentID=${frame.fragmentID}, fragmentIndex=${frame.fragmentIndex} from ${this.rinfo.address}:${this.rinfo.port}`
      )
      this.handleFragmentedFrame(frame)
      return
    }

    if (frame.isSequenced()) {
      if (this.highestSequenceIndex.has(frame.orderChannel)) {
        const highestSequenceIndex = this.highestSequenceIndex.get(
          frame.orderChannel
        )!
        const inputOrderIndex =
          this.inputOrderIndex.get(frame.orderChannel) ?? 0
        if (
          frame.sequenceIndex < highestSequenceIndex ||
          frame.orderedIndex < inputOrderIndex
        ) {
          // packet is too old
          return
        }

        this.highestSequenceIndex.set(
          frame.orderChannel,
          frame.sequenceIndex + 1
        )
      } else {
        this.highestSequenceIndex.set(frame.orderChannel, frame.orderedIndex)
      }

      this.handleFrame(frame)
    } else if (frame.isOrdered()) {
      if (!this.inputOrderIndex.has(frame.orderChannel)) {
        this.inputOrderIndex.set(frame.orderChannel, 0)
        this.inputOrderingQueue.set(frame.orderChannel, new Map())
      }

      // Check if it's the next expected packet
      const expectedOrderIndex = this.inputOrderIndex.get(frame.orderChannel)!
      if (frame.orderedIndex == expectedOrderIndex) {
        this.highestSequenceIndex.set(frame.orderedIndex, 0)
        // Update the next expected index
        const nextExpectedOrderIndex = expectedOrderIndex + 1
        this.inputOrderIndex.set(frame.orderChannel, nextExpectedOrderIndex)

        this.handleFrame(frame)
        const outOfOrderQueue = this.inputOrderingQueue.get(frame.orderChannel)!
        let i = nextExpectedOrderIndex
        for (; outOfOrderQueue.has(i); i++) {
          const packet = outOfOrderQueue.get(i)!
          this.handleFrame(packet)
          outOfOrderQueue.delete(i)
        }

        this.inputOrderIndex.set(frame.orderChannel, i)
      } else if (frame.orderedIndex > expectedOrderIndex) {
        this.inputOrderingQueue
          .get(frame.orderChannel)!
          .set(frame.orderedIndex, frame)
      } else {
        // duplicated packet
        return
      }
    } else {
      this.handleFrame(frame)
    }
  }

  private handleFrame(frame: Frame): void {
    const packetId = frame.content.readUInt8(0)
    const stream = new BinaryStream(frame.content)

    switch (packetId) {
      case Identifiers.CONNECTED_PING:
        const connectedPing = new ConnectedPing()
        connectedPing.internalDecode(stream)

        const connectedPong = new ConnectedPong()
        connectedPong.clientTimestamp = connectedPing.timestamp
        connectedPong.timestamp = process.hrtime.bigint()
        this.sendInstantPacket(connectedPong)
        break
      case Identifiers.CONNECTION_REQUEST:
        const connectionRequest = new ConnectionRequest()
        connectionRequest.internalDecode(stream)

        const connectionRequestAccepted = new ConnectionRequestAccepted()
        connectionRequestAccepted.clientAddress = this.rinfo
        connectionRequestAccepted.clientTimestamp = connectionRequest.timestamp
        connectionRequestAccepted.timestamp = process.hrtime.bigint()
        this.sendInstantPacket(connectionRequestAccepted)
        break
      case Identifiers.NEW_INCOMING_CONNECTION:
        const newIncomingConnection = new NewIncomingConnection()
        newIncomingConnection.internalDecode(stream)
        break
      case Identifiers.DISCONNECT_NOTIFICATION:
        this.socket.removeSession(this)
        break
      case Identifiers.GAME_PACKET:
        this.socket.emit(NetEvents.GAME_PACKET, stream, this)
        break
      default:
        this.logger.debug(
          `Unhandled packet with ID=${packetId.toString(16)} from ${
            this.rinfo.address
          }:${this.rinfo.port}`
        )
    }
  }

  private handleFragmentedFrame(frame: Frame) {
    assert(frame.isFragmented(), 'Cannot reasseble a non fragmented packet')
    const fragmentID = frame.fragmentID
    const fragmentIndex = frame.fragmentIndex
    if (!this.fragmentedFrames.has(fragmentID)) {
      this.fragmentedFrames.set(fragmentID, new Map([[fragmentIndex, frame]]))
    } else {
      const fragments = this.fragmentedFrames.get(fragmentID)!
      fragments.set(fragmentIndex, frame)
      this.fragmentedFrames.set(fragmentID, fragments)

      if (frame.fragmentSize == fragments.size) {
        const finalContent = new BinaryStream()
        const fragments = this.fragmentedFrames.get(fragmentID)!
        // Ensure the correctness of the buffer orders
        for (let i = 0; i < fragments.size; i++) {
          const splitContent = fragments.get(i)!
          finalContent.write(splitContent.content)
        }

        const firstFrame = fragments.get(0)!
        const reliability = firstFrame.reliability
        const finalFrame = new Frame()
        finalFrame.content = finalContent.getBuffer()
        finalFrame.reliability = reliability
        if (firstFrame.isOrdered()) {
          finalFrame.orderedIndex = firstFrame.orderedIndex
          finalFrame.orderChannel = firstFrame.orderChannel
        }

        this.fragmentedFrames.delete(fragmentID)
        this.processFrame(finalFrame)
      }
    }
  }

  public sendInstantBuffer(
    buffer: Buffer,
    reliability = FrameReliability.UNRELIABLE
  ): void {
    const frame = new Frame()
    frame.reliability = reliability
    frame.content = buffer
    this.sendImmediateFrame(frame)
  }

  public sendInstantPacket<T extends Packet>(
    packet: T,
    reliability = FrameReliability.UNRELIABLE
  ): void {
    const frame = new Frame()
    frame.reliability = reliability
    frame.content = packet.internalEncode()
    this.sendImmediateFrame(frame)
  }

  public sendQueuedBuffer(
    buffer: Buffer,
    reliability = FrameReliability.UNRELIABLE
  ): void {
    const frame = new Frame()
    frame.reliability = reliability
    frame.content = buffer
    this.sendQueuedFrame(frame)
  }

  public sendQueuedPacket<T extends Packet>(
    packet: T,
    reliability = FrameReliability.UNRELIABLE
  ): void {
    const buffer = packet.internalEncode()
    this.sendQueuedBuffer(buffer, reliability)
  }

  private getFilledFrame(frame: Frame): Frame {
    if (frame.isReliable()) {
      frame.reliableIndex = this.outputReliableIndex++
      if (frame.isOrdered()) {
        if (!this.orderingIndexes.has(frame.orderChannel)) {
          this.orderingIndexes.set(frame.orderChannel, 0)
          frame.orderedIndex = 0
        } else {
          const orderIndex = this.orderingIndexes.get(frame.orderChannel)!
          this.orderingIndexes.set(frame.orderChannel, orderIndex + 1)
          frame.orderedIndex = orderIndex + 1
        }
      }
    }
    return frame
  }

  private fragmentFrame(frame: Frame): Frame[] {
    const fragments: Array<Frame> = []
    const buffers: Map<number, Buffer> = new Map()
    let index = 0,
      splitIndex = 0

    while (index < frame.content.byteLength) {
      // Push format: [chunk index: int, chunk: buffer]
      buffers.set(splitIndex++, frame.content.slice(index, (index += this.mtu)))
    }

    for (const [index, buffer] of buffers) {
      const newFrame = new Frame()
      newFrame.fragmentID = this.fragmentID
      newFrame.fragmentSize = buffers.size
      newFrame.fragmentIndex = index
      newFrame.reliability = frame.reliability
      newFrame.content = buffer

      if (newFrame.isReliable()) {
        // By logic we already increased by one the index before splitting
        // and after splitting we are increasing again skipping a reliable index
        // this hack will reuse the prevous index in order to avoid skipping
        if (index == 0) {
          newFrame.reliableIndex = frame.reliableIndex
        } else {
          newFrame.reliableIndex = this.outputReliableIndex++
        }
        if (newFrame.isOrdered()) {
          newFrame.orderChannel = frame.orderChannel
          newFrame.orderedIndex = frame.orderedIndex
        }
      }

      fragments.push(newFrame)
    }

    // Increase the splitID for the next split packet
    this.fragmentID++

    return fragments
  }

  private sendQueuedFrame(frame: Frame): void {
    const filledFrame = this.getFilledFrame(frame)

    // Split the frame in multiple frames if its bytelength
    // length exceeds the maximumx transfer unit limit
    if (filledFrame.getByteSize() > this.mtu) {
      this.fragmentFrame(filledFrame).forEach(frame => {
        this.outputFramesQueue.add(frame)
      })
    } else {
      this.outputFramesQueue.add(frame)
    }
  }

  private sendImmediateFrame(frame: Frame): void {
    const filledFrame = this.getFilledFrame(frame)

    if (filledFrame.getByteSize() > this.mtu) {
      this.fragmentFrame(frame).forEach(fragment => {
        const frameSet = new FrameSetPacket()
        frameSet.sequenceNumber = this.outputSequenceNumber++
        frameSet.frames.push(fragment)
        this.sendFrameSet(frameSet)
      })
    } else {
      const frameSet = new FrameSetPacket()
      frameSet.sequenceNumber = this.outputSequenceNumber++
      frameSet.frames.push(frame)
      this.sendFrameSet(frameSet)
    }
  }

  private sendLostFrameSet(sequenceNumber: number): void {
    if (this.outputFrameSets.has(sequenceNumber)) {
      const packet = this.outputFrameSets.get(sequenceNumber)!
      this.outputFrameSets.delete(sequenceNumber)
      // Skip queues when resending a lost packet
      this.sendInstantPacket(packet)
      this.logger.debug(
        `Sent lost packet with sequenceNumber=${sequenceNumber} to ${this.rinfo.address}:${this.rinfo.port}`
      )
    } else {
      this.logger.debug(
        `Cannot find lost frame set with sequenceNumber=${sequenceNumber}`
      )
    }
  }

  private handleAcknowledgement(stream: BinaryStream): void {
    const ack = new Acknowledgement()
    ack.internalDecode(stream)
    for (const record of ack.records) {
      // Here we receive the sequence numbers of
      // packets that the other end succesfully received
      // so we just delete them from our send backup queue
      if (record.isSingle()) {
        const seqNum = (record as SingleRecord).getSeqNumber()
        if (this.outputFrameSets.has(seqNum)) {
          this.outputFrameSets.delete(seqNum)
          this.logger.debug(
            `Removed sent packet from backup queue with seqNum=${seqNum}`
          )
        }
      } else {
        const startSeqNum = (record as RangedRecord).getStartSeqNumber()
        const endSeqNum = (record as RangedRecord).getEndSeqNumber()

        for (let i = startSeqNum; i <= endSeqNum; i++) {
          if (this.outputFrameSets.has(i)) {
            this.outputFrameSets.delete(i)
            this.logger.debug(
              `Removed sent packet from backup queue with seqNum=${i}`
            )
          }
        }
      }
    }
  }

  private handleNacknowledgement(stream: BinaryStream): void {
    const nack = new NotAcknowledgement()
    nack.internalDecode(stream)

    nack.records.forEach(record => {
      if (record.isSingle()) {
        this.sendLostFrameSet((record as SingleRecord).getSeqNumber())
      } else {
        const startSeqNum = (record as RangedRecord).getStartSeqNumber()
        const endSeqNum = (record as RangedRecord).getStartSeqNumber()
        for (let i = startSeqNum; i < endSeqNum; i++) {
          this.sendLostFrameSet(i)
        }
      }
    })
  }

  private async handleOpenConnectionRequestOne(
    stream: BinaryStream
  ): Promise<void> {
    const openConnectionRequestOne = new OpenConnectionRequestOne()
    openConnectionRequestOne.internalDecode(stream)

    if (openConnectionRequestOne.remoteProtocol != Info.PROTOCOL) {
      // TODO: this.sendIncompatibleProtocolVersion()
      return
    }

    const openConnectionReplyOne = new OpenConnectionReplyOne()
    openConnectionReplyOne.maximumTransferUnit =
      openConnectionRequestOne.maximumTransferUnit
    openConnectionReplyOne.serverGuid = this.socket.getGuid()

    this.sendPacket(openConnectionReplyOne)
  }

  private async handleOpenConnectionRequestTwo(
    stream: BinaryStream
  ): Promise<void> {
    const openConnectionRequestTwo = new OpenConnectionRequestTwo()
    openConnectionRequestTwo.internalDecode(stream)

    const openConnectionReplyTwo = new OpenConnectionReplyTwo()
    openConnectionReplyTwo.clientAddress = this.rinfo
    openConnectionReplyTwo.maximumTransferUnit =
      openConnectionRequestTwo.maximumTransferUnit
    openConnectionReplyTwo.serverGuid = this.socket.getGuid()

    this.mtu = openConnectionRequestTwo.maximumTransferUnit
    this.logger.debug(
      `Maximum Transfer Unit agreed to be: ${this.mtu} with ${this.rinfo.address}:${this.rinfo.port}`
    )
    this.sendPacket(openConnectionReplyTwo)
  }

  private sendFrameSet(frameSet: FrameSetPacket): void {
    // Add the frame into a backup queue
    this.outputFrameSets.set(frameSet.sequenceNumber, frameSet)
    this.sendPacket(frameSet)
  }

  public sendPacket<T extends Packet>(packet: T): void {
    RakServer.sendPacket(packet, this.rinfo)
  }

  public getRemoteInfo(): RemoteInfo {
    return this.rinfo
  }
}
