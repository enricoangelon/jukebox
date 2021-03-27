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
import { NewIncomingConnection } from './protocol/connection/new-incoming-connection'
import { OpenConnectionReplyOne } from './protocol/connection/open-connection-reply-one'
import { OpenConnectionReplyTwo } from './protocol/connection/open-connection-reply-two'
import { OpenConnectionRequestOne } from './protocol/connection/open-connection-request-one'
import { OpenConnectionRequestTwo } from './protocol/connection/open-connection-request-two'
import { Packet } from './packet'
import { RakServer } from './server'
import { RemoteInfo } from 'dgram'
import { assert } from 'console'

export class NetworkSession {
  private readonly socket: RakServer
  private readonly rinfo: RemoteInfo
  private readonly logger: Logger

  private guid: bigint | null
  // MaximumTransferUnit used to indetify
  // maximum buffer length we can send per packet
  private mtu: number

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
  // Used to identify split packets
  private fragmentID = 0

  // fragmentID -> FragmentedFrame ( index -> buffer )
  private fragmentedFrames: Map<number, Map<number, Frame>> = new Map()

  public constructor(socket: RakServer, rinfo: RemoteInfo, logger: Logger) {
    this.guid = null
    this.logger = logger
    this.socket = socket
    this.rinfo = rinfo
  }

  public tick(timestamp: number): void {
    // Acknowledge recived packets to the other end
    if (this.inputSequenceNumbers.size > 0) {
      // Temporary solution because i am noob :(
      const records: Set<Record> = new Set()
      for (const seq of this.inputSequenceNumbers) {
        records.add(new SingleRecord(seq))
      }

      // Just a friendly logger... what's wrong with it... it's honest after all
      const sequences = Array.from(this.inputSequenceNumbers)
      this.logger.debug(`Sent multiple single ACKs: ${sequences.join(', ')}`)

      /* 
      TODO: implement ranges
      if (this.inputSequenceNumbers.size == 1) {
        const sequenceNumber = this.inputSequenceNumbers.values().next().value
        records.add(new SingleRecord(sequenceNumber))
      } else {
        let min = Math.min(...this.inputSequenceNumbers)
        const max = Math.max(...this.inputSequenceNumbers)
        for (let i = min; i <= max; i++) {
          if (!this.inputSequenceNumbers.has(i)) {
            records.add(new RangedRecord(min, i - 1))
          } else {
            this.inputSequenceNumbers.delete(i)
          }
        }
      }
      */

      const ack = new Acknowledgement()
      ack.records = records
      this.sendPacket(ack)
      this.inputSequenceNumbers.clear()
    }

    // Not Acknowledge nonm received packets
    if (this.nackSequenceNumbers.size > 0) {
      this.logger.debug('Received a NACK')
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
      frameSet.frames = Array.from(this.outputFramesQueue)
      this.logger.debug(
        `Sent FrameSet with sequenceNumber=${frameSet.sequenceNumber} holding ${frameSet.frames.length} frame(s)`
      )
      this.sendPacket(frameSet)
      this.outputFramesQueue.clear()
    }
  }

  public async handle(stream: BinaryStream, rinfo: RemoteInfo): Promise<void> {
    if (!(await this.handleDatagram(stream, rinfo))) {
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

  private async handleDatagram(
    stream: BinaryStream,
    rinfo: RemoteInfo
  ): Promise<boolean> {
    // Used to timout the client if we don't receive new packets
    this.receiveTimestamp = Date.now()

    const packetId = stream.getBuffer().readUInt8(0)
    if (packetId == Identifiers.OPEN_CONNECTION_REQUEST_1) {
      await this.handleOpenConnectionRequestOne(stream)
      return true
    } else if (packetId == Identifiers.OPEN_CONNECTION_REQUEST_2) {
      await this.handleOpenConnectionRequestTwo(stream, rinfo)
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
        `Discarded already received FrameSet with sequenceNumber=${frameSetPacket.sequenceNumber}`
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
      this.handleFrame(frame)
    }
  }

  private handleFrame(frame: Frame): void {
    if (frame.isFragmented()) {
      this.logger.debug(
        `Recived a fragmented Frame fragmentSize=${frame.fragmentSize}, fragmentID=${frame.fragmentID}, fragmentIndex=${frame.fragmentIndex}`
      )
      return this.handleFragmentedFrame(frame)
    }

    const packetId = frame.content.readUInt8(0)
    const stream = new BinaryStream(frame.content)

    switch (packetId) {
      case Identifiers.CONNECTED_PING:
        const connectedPing = new ConnectedPing()
        connectedPing.internalDecode(stream)

        const connectedPong = new ConnectedPong()
        connectedPong.clientTimestamp = connectedPing.timestamp
        connectedPong.timestamp = BigInt(Date.now())
        this.sendInstantPacket(connectedPong)
        break
      case Identifiers.CONNECTION_REQUEST:
        const connectionRequest = new ConnectionRequest()
        connectionRequest.internalDecode(stream)

        // TODO: GUID implementation
        this.guid = connectionRequest.clientGUID

        const connectionRequestAccepted = new ConnectionRequestAccepted()
        connectionRequestAccepted.clientAddress = this.rinfo
        connectionRequestAccepted.clientTimestamp = connectionRequest.timestamp
        connectionRequestAccepted.timestamp = BigInt(Date.now())
        this.sendInstantPacket(connectionRequestAccepted)
        break
      case Identifiers.NEW_INCOMING_CONNECTION:
        const newIncomingConnection = new NewIncomingConnection()
        newIncomingConnection.internalDecode(stream)
        // TODO: aynthing to do here?
        break
      case Identifiers.DISCONNECT_NOTIFICATION:
        this.socket.removeSession(this)
        break
      case Identifiers.GAME_PACKET:
        this.socket.emit('game_packet', stream, this.rinfo)
        break
      default:
        this.logger.debug(`Unhandled packet with ID=${packetId.toString(16)}`)
    }
  }

  private handleFragmentedFrame(frame: Frame) {
    assert(frame.isFragmented(), 'Cannot reasseble a non fragmented packet')
    const fragmentID = frame.fragmentID
    const fragmentIndex = frame.fragmentIndex
    if (!this.fragmentedFrames.has(fragmentID)) {
      const fragments = new Map()
      fragments.set(fragmentIndex, frame)
      this.fragmentedFrames.set(fragmentID, fragments)
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

        // TODO: not sure if i should set reliability
        // of the first splitted packet, need to confirm
        const firstFrame = fragments.get(0)!
        const reliability = firstFrame.reliability
        const finalFrame = new Frame()
        finalFrame.content = finalContent.getBuffer()
        finalFrame.reliability = reliability
        if (firstFrame.isOrdered()) {
          finalFrame.orderedIndex = firstFrame.orderedIndex
          firstFrame.orderChannel = firstFrame.orderChannel
        }

        this.fragmentedFrames.delete(fragmentID)
        this.handleFrame(finalFrame)
      }
    }
  }

  public sendInstantPacket<T extends Packet>(
    packet: T,
    reliability = FrameReliability.UNRELIABLE
  ): void {
    const frame = new Frame()
    frame.reliability = reliability
    frame.content = packet.internalEncode()
    const frameSet = new FrameSetPacket()
    frameSet.sequenceNumber = this.outputSequenceNumber++
    frameSet.frames.push(frame)
    this.sendPacket(frameSet)
  }

  public sendQueuedPacket<T extends Packet>(
    packet: T,
    reliability = FrameReliability.UNRELIABLE
  ): void {
    const frame = new Frame()
    frame.reliability = reliability
    frame.content = packet.internalEncode()
    this.sendQueuedFrame(frame)
  }

  private sendQueuedFrame(frame: Frame): void {
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

    // Split the frame in multiple frames if its bytelength
    // length exceeds the maximumx transfer unit limit
    if (frame.getByteSize() > this.mtu) {
      const buffers: Map<number, Buffer> = new Map()
      let index = 0,
        splitIndex = 0

      while (index < frame.content.byteLength) {
        // Push format: [chunk index: int, chunk: buffer]
        buffers.set(
          splitIndex++,
          frame.content.slice(index, (index += this.mtu))
        )
      }

      for (const [index, buffer] of buffers) {
        const newFrame = new Frame()
        newFrame.fragmentID = this.fragmentID++
        newFrame.fragmentSize = buffers.size
        newFrame.fragmentIndex = index
        newFrame.reliability = frame.reliability
        newFrame.content = buffer

        if (frame.isReliable()) {
          newFrame.reliableIndex = this.outputReliableIndex++
          if (newFrame.isOrdered()) {
            newFrame.orderChannel = frame.orderChannel
            newFrame.orderedIndex = frame.orderedIndex
          }
        }

        // TODO: need to recursive resend?
        this.outputFramesQueue.add(frame)
      }
    } else {
      this.outputFramesQueue.add(frame)
    }
  }

  private sendLostFrameSet(sequenceNumber: number): void {}

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
    // this.sendLostFrameSet()
    this.logger.debug('GOT NACK')
  }

  private async handleOpenConnectionRequestOne(
    stream: BinaryStream
  ): Promise<void> {
    // TODO: client GUID handling
    // if (this.socket.hasClientGuid(this.getGuid())) {
    //  this.sendAlreadyConnected()
    //  return
    // }
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
    stream: BinaryStream,
    rinfo: RemoteInfo
  ): Promise<void> {
    const openConnectionRequestTwo = new OpenConnectionRequestTwo()
    openConnectionRequestTwo.internalDecode(stream)

    const openConnectionReplyTwo = new OpenConnectionReplyTwo()
    openConnectionReplyTwo.clientAddress = rinfo
    openConnectionReplyTwo.maximumTransferUnit =
      openConnectionRequestTwo.maximumTransferUnit
    openConnectionReplyTwo.serverGuid = this.socket.getGuid()

    this.mtu = openConnectionRequestTwo.maximumTransferUnit

    // TODO: guid
    // if (this.socket.hasClientGuid(this.getGuid())) {
    //  this.sendAlreadyConnected()
    //  return
    // }

    // this.socket.addGuidSession(this)
    this.sendPacket(openConnectionReplyTwo)
  }

  public sendPacket<T extends Packet>(packet: T): void {
    RakServer.sendPacket(packet, this.rinfo)
  }

  public getRemoteInfo(): RemoteInfo {
    return this.rinfo
  }

  public getGuid(): bigint {
    return this.guid!
  }
}
