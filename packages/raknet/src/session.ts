import { assert } from 'console'
import { RemoteInfo } from 'dgram'

import { BinaryStream, WriteStream } from '@jukebox/binarystream'
import { Logger } from '@jukebox/logger'

import { Identifiers } from './identifiers'
import { Info } from './info'
import { NetEvents } from './net-events'
import { Packet } from './packet'
import { Acknowledgement } from './protocol/acknowledgement'
import { ConnectedPing } from './protocol/connection/connected-ping'
import { ConnectedPong } from './protocol/connection/connected-pong'
import { IncompatibleProtocolVersion } from './protocol/connection/incompatible-protocol-version'
import { NewIncomingConnection } from './protocol/connection/new-incoming-connection'
import { OpenConnectionReplyOne } from './protocol/connection/open-connection-reply-one'
import { OpenConnectionReplyTwo } from './protocol/connection/open-connection-reply-two'
import { OpenConnectionRequestOne } from './protocol/connection/open-connection-request-one'
import { OpenConnectionRequestTwo } from './protocol/connection/open-connection-request-two'
import { Frame } from './protocol/frame'
import { FrameFlags } from './protocol/frame-flags'
import { FrameReliability } from './protocol/frame-reliability'
import { FrameSetPacket } from './protocol/frame-set-packet'
import { ConnectionRequest } from './protocol/login/connection-request'
import { ConnectionRequestAccepted } from './protocol/login/connection-request-accepted'
import { NotAcknowledgement } from './protocol/not-acknowledgement'
import { RangedRecord, Record, SingleRecord } from './record'
import { RakServer } from './server'

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
  // Holds the sequence index for the order channel 0
  private outputSequenceIndex = 0
  // Holds the sequence number of lost packets
  private nackSequenceNumbers: Set<number> = new Set()

  // Used by ordered reliable frame sets (only for order channel 0)
  private orderingIndex = 0
  // Input ordering queue
  private inputOrderIndex: Map<number, number> = new Map()
  private inputOrderingQueue: Map<number, Map<number, Frame>> = new Map()
  private highestSequenceIndex: Map<number, number> = new Map()
  // Used to identify split packets
  private fragmentID = 0

  // fragmentID -> FragmentedFrame ( index -> buffer )
  private fragmentedFrames: Map<number, Map<number, Frame>> = new Map()

  // The average of 5 times it takes connected ping to arrive
  private pings: Array<number> = [0, 0, 0, 0, 0]

  public constructor(socket: RakServer, rinfo: RemoteInfo, logger: Logger) {
    this.logger = logger
    this.socket = socket
    this.rinfo = rinfo
  }

  public tick(): void {
    // Timeout if we don't receive any packet after 10 seconds
    if (Date.now() - this.receiveTimestamp >= 10_000) {
      this.socket.removeSession(this)
      this.logger.info(`[${this.getAddrToken()}] logged out due to timeout!`)
    }

    // Acknowledge recived packets to the other end
    if (this.inputSequenceNumbers.size > 0) {
      const records = this.generateRecords(this.inputSequenceNumbers)
      const ack = new Acknowledgement()
      ack.records = records

      const recordsByteSize: number = [...records]
        .map(re => (re.isSingle() ? 4 : 7))
        .reduce((tot, v) => tot + v, 0)
      // Buffer size: HEADER (1) + 2 + records byte size
      const writeStream = new WriteStream(
        Buffer.allocUnsafe(3 + recordsByteSize)
      )
      const buffer = ack.internalEncode(writeStream)
      RakServer.sendBuffer(buffer, this.rinfo)
    }

    // Not Acknowledge non received packets to the other end
    if (this.nackSequenceNumbers.size > 0) {
      const records = this.generateRecords(this.nackSequenceNumbers)
      const nack = new NotAcknowledgement()
      nack.records = records

      const recordsByteSize: number = [...records]
        .map(re => (re.isSingle() ? 4 : 7))
        .reduce((tot, v) => tot + v, 0)
      // Buffer size: HEADER (1) + 2 + records byte size
      const writeStream = new WriteStream(
        Buffer.allocUnsafe(3 + recordsByteSize)
      )
      const buffer = nack.internalEncode(writeStream)
      RakServer.sendBuffer(buffer, this.rinfo)
    }

    // Send all queued frames and clear queue
    if (this.outputFramesQueue.size > 0) {
      this.sendOutputFrames()
    }
  }

  private sendOutputFrames() {
    const frameSet = new FrameSetPacket()
    frameSet.sequenceNumber = this.outputSequenceNumber++
    const frames = Array.from(this.outputFramesQueue)
    frameSet.frames = frames
    this.logger.debug(
      `[${this.getAddrToken()}] Sent FrameSet with sequenceNumber=${
        frameSet.sequenceNumber
      } holding ${frameSet.frames.length} frame(s)`
    )
    this.sendFrameSet(frameSet)
    // Delete sent frames from output queue
    for (const frame of frames) {
      this.outputFramesQueue.delete(frame)
    }
  }

  public async handle(stream: BinaryStream): Promise<void> {
    // Used to timout the client if we don't receive new packets
    this.receiveTimestamp = Date.now()

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
        `[${this.getAddrToken()}] Discarded already received FrameSet with sequenceNumber=${
          frameSetPacket.sequenceNumber
        }`
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

    // Handle frames batched into framesets
    for (const frame of frameSetPacket.frames) {
      this.processFrame(frame)
    }
  }

  private processFrame(frame: Frame): void {
    if (frame.isFragmented()) {
      this.logger.debug(
        `[${this.getAddrToken()}] Recived a fragmented Frame fragmentSize=${
          frame.fragmentSize
        }, fragmentID=${frame.fragmentID}, fragmentIndex=${frame.fragmentIndex}`
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
        const startDecodeMS = process.hrtime()
        const connectedPing = new ConnectedPing()
        connectedPing.internalDecode(stream)

        const clientSendTime = Number(connectedPing.timestamp)
        const serverCurrentTimestamp = Number(process.hrtime.bigint()) / 1e6
        const endDecodeMS = process.hrtime(startDecodeMS)
        const decodeMillis = endDecodeMS[1] * 1e-6

        // To calculate the ping, i also removed the time the packet took to decode
        this.pings.push(serverCurrentTimestamp - clientSendTime - decodeMillis)
        this.pings.shift()

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
          `[${this.getAddrToken()}] Unhandled packet with ID=${packetId.toString(
            16
          )}`
        )
    }
  }

  private handleFragmentedFrame(frame: Frame) {
    assert(
      frame.isFragmented(),
      `[${this.getAddrToken()}] Cannot reasseble a non fragmented packet`
    )
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
    // Buffer size: mtu?!
    const stream = new WriteStream(Buffer.allocUnsafe(1024 * 1024 * 2))
    frame.content = packet.internalEncode(stream)
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
    const stream = new WriteStream(Buffer.allocUnsafe(1024 * 1024 * 2))
    const buffer = packet.internalEncode(stream)
    this.sendQueuedBuffer(buffer, reliability)
  }

  private getFilledFrame(frame: Frame): Frame {
    if (frame.isReliable()) {
      frame.reliableIndex = this.outputReliableIndex++
    }

    if (frame.isOrdered()) {
      if (frame.isSequenced()) {
        frame.orderedIndex = this.orderingIndex // Sequenced packets don't increase the ordered channel index
      } else {
        frame.orderedIndex = this.orderingIndex++
      }
    }

    if (frame.isSequenced()) {
      frame.sequenceIndex = this.outputSequenceIndex++
    }
    return frame
  }

  private async fragmentFrame(frame: Frame, mtu: number): Promise<Frame[]> {
    return new Promise(resolve => {
      const fragments: Array<Frame> = []
      const buffers: Map<number, Buffer> = new Map()
      let index = 0,
        splitIndex = 0

      // While is thread blocking, so that's why i put this in a promise
      while (index < frame.content.byteLength) {
        // Push format: [chunk index: int, chunk: buffer]
        buffers.set(splitIndex++, frame.content.slice(index, (index += mtu)))
      }

      const fragmentId = this.fragmentID++ % 65536 // Overflow
      for (const [index, buffer] of buffers) {
        const newFrame = new Frame()
        newFrame.fragmentID = fragmentId
        newFrame.fragmentSize = buffers.size
        newFrame.fragmentIndex = index
        newFrame.reliability = frame.reliability
        newFrame.content = buffer

        if (newFrame.isReliable()) {
          newFrame.reliableIndex = this.outputReliableIndex++
        }

        newFrame.sequenceIndex = frame.sequenceIndex
        newFrame.orderChannel = frame.orderChannel
        newFrame.orderedIndex = frame.orderedIndex

        fragments.push(newFrame)
      }

      resolve(fragments)
    })
  }

  private sendQueuedFrame(frame: Frame): void {
    const filledFrame = this.getFilledFrame(frame)

    // Split the frame in multiple frames if its bytelength
    // length exceeds the maximumx transfer unit limit
    const maxMtu = this.mtu - 60 // Padding for some RakNet headers
    if (filledFrame.getByteSize() > maxMtu) {
      this.fragmentFrame(filledFrame, maxMtu).then(frames => {
        for (const fragmentedFrame of frames) {
          const framesLen = [...this.outputFramesQueue]
            .map(frame => frame.getByteSize())
            .reduce((accum, len) => accum + len, 0)
          if (framesLen + fragmentedFrame.getByteSize() > this.mtu) {
            this.sendOutputFrames()
          }
          this.outputFramesQueue.add(fragmentedFrame)
        }
      })
    } else {
      this.outputFramesQueue.add(frame)
    }
  }

  private sendImmediateFrame(frame: Frame): void {
    const filledFrame = this.getFilledFrame(frame)
    const maxMtu = this.mtu - 60 // Padding for some RakNet headers
    if (filledFrame.getByteSize() > maxMtu) {
      this.fragmentFrame(filledFrame, maxMtu).then(frames => {
        for (const fragmentedFrame of frames) {
          const frameSet = new FrameSetPacket()
          frameSet.sequenceNumber = this.outputSequenceNumber++
          frameSet.frames.push(fragmentedFrame)
          this.sendFrameSet(frameSet)
        }
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
      this.sendInstantPacket(packet, FrameReliability.RELIABLE_ORDERED)
      this.logger.debug(
        `[${this.getAddrToken()}] Sent lost packet with sequenceNumber=${sequenceNumber}`
      )
    } else {
      this.logger.debug(
        `[${this.getAddrToken()}] Cannot find lost frame set with sequenceNumber=${sequenceNumber}`
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
            `[${this.getAddrToken()}] Removed sent packet from backup queue with seqNum=${seqNum}`
          )
        }
      } else {
        const startSeqNum = (record as RangedRecord).getStartSeqNumber()
        const endSeqNum = (record as RangedRecord).getEndSeqNumber()

        for (let i = startSeqNum; i <= endSeqNum; i++) {
          if (this.outputFrameSets.has(i)) {
            this.outputFrameSets.delete(i)
          }
        }

        this.logger.debug(
          `[${this.getAddrToken()}] Removed sent packets from backup queue with startSeq=${startSeqNum} endSeq=${endSeqNum}`
        )
      }
    }
  }

  private handleNacknowledgement(stream: BinaryStream): void {
    const nack = new NotAcknowledgement()
    nack.internalDecode(stream)

    for (const record of nack.records) {
      if (record.isSingle()) {
        this.sendLostFrameSet((record as SingleRecord).getSeqNumber())
      } else {
        const startSeqNum = (record as RangedRecord).getStartSeqNumber()
        const endSeqNum = (record as RangedRecord).getStartSeqNumber()
        for (let i = startSeqNum; i < endSeqNum; i++) {
          this.sendLostFrameSet(i)
        }
      }
    }
  }

  private async handleOpenConnectionRequestOne(
    stream: BinaryStream
  ): Promise<void> {
    const openConnectionRequestOne = new OpenConnectionRequestOne()
    openConnectionRequestOne.internalDecode(stream)

    if (openConnectionRequestOne.remoteProtocol != Info.PROTOCOL) {
      this.sendIncompatibleProtocolVersion()
      return
    }

    const openConnectionReplyOne = new OpenConnectionReplyOne()
    openConnectionReplyOne.maximumTransferUnit =
      openConnectionRequestOne.maximumTransferUnit
    openConnectionReplyOne.serverGuid = this.socket.getGuid()

    // Buffer size: HEADER (1) + MAGIC (16) + 8 + 1 + 2
    const writeStream = new WriteStream(Buffer.allocUnsafe(28))
    const buffer = openConnectionReplyOne.internalEncode(writeStream)
    RakServer.sendBuffer(buffer, this.rinfo)
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
      `[${this.getAddrToken()}] Maximum Transfer Unit agreed to be: ${this.mtu}`
    )

    // Buffer size: HEADER (1) + MAGIC (16) + 8 + IPV4 (6) + 2 + 1
    const writeStream = new WriteStream(Buffer.allocUnsafe(34))
    const buffer = openConnectionReplyTwo.internalEncode(writeStream)
    RakServer.sendBuffer(buffer, this.rinfo)
  }

  private sendIncompatibleProtocolVersion(): void {
    const incompatibleProtocolVersion = new IncompatibleProtocolVersion()
    incompatibleProtocolVersion.serverProtocol = Info.PROTOCOL
    incompatibleProtocolVersion.serverGUID = this.socket.getGuid()

    // Buffer size: HEADER (1) + MAGIC (16) + 8 + 1
    const writeStream = new WriteStream(Buffer.allocUnsafe(26))
    const buffer = incompatibleProtocolVersion.internalEncode(writeStream)
    RakServer.sendBuffer(buffer, this.rinfo)
  }

  /**
   * This function will basically generate the records to be sent in (N)ACKs
   * by just requiring the set containing sequence numbers.
   *
   * @param sequenceNumbers A set containing sequence numbers
   */
  private generateRecords(sequenceNumbers: Set<number>): Set<Record> {
    const records: Set<Record> = new Set()
    const sequences = Array.from(sequenceNumbers).sort((a, b) => a - b)

    const deleteSeqFromInputQueue = (seqNum: number) => {
      if (!sequenceNumbers.has(seqNum)) {
        this.logger.debug(
          `[${this.getAddrToken()}] Cannot find sequnece number (${seqNum}) in input queue`
        )
        return
      }
      sequenceNumbers.delete(seqNum)
    }

    for (let i = 1, continuous = 0; i <= sequences.length; i++) {
      const prevSeq = sequences[i - 1]
      // In the last iteration sequences[i] will be undefined, but it does its job correctly
      // It's a bug that works :=D
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

    return records
  }

  private sendFrameSet(frameSet: FrameSetPacket): void {
    // Add the frame into a backup queue
    this.outputFrameSets.set(frameSet.sequenceNumber, frameSet)
    this.sendPacket(frameSet)
  }

  public sendPacket<T extends Packet>(packet: T): void {
    RakServer.sendPacket(packet, this.rinfo)
  }

  public getPing(): number {
    return Math.trunc(this.pings.reduce((a, b) => a + b) / this.pings.length)
  }

  public getAddrToken(): string {
    return `${this.rinfo.address}:${this.rinfo.port}`
  }

  public getRemoteInfo(): RemoteInfo {
    return this.rinfo
  }
}
