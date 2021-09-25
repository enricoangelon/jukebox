import assert from 'assert'
import { createHash, createPublicKey, randomBytes } from 'crypto'
import { decode, sign, verify } from 'jsonwebtoken'
import PromiseQueue from 'promise-queue'

import { BinaryStream, WriteStream } from '@jukebox/binarystream'
import { NetworkSession } from '@jukebox/raknet'
import { FrameReliability } from '@jukebox/raknet/lib/protocol/frame-reliability'

import { EntityPlayer } from '../entity/player'
import { Jukebox } from '../jukebox'
import { Vector3 } from '../math/vector3'
import { Difficulty } from '../world/difficulty'
import { Dimension } from '../world/dimension'
import { Gamemode } from '../world/gamemode'
import { Generator } from '../world/generator/generator'
import { McpeAddPlayer } from './minecraft/add-player'
import {
  ActionPermission,
  AdventureSetting,
  McpeAdventureSettings,
  PermissionLevel,
} from './minecraft/adventure-settings'
import { McpeBiomeDefinitionList } from './minecraft/biome-definition-list'
import { McpeChunkRadiusUpdated } from './minecraft/chunk-radius-updated'
import { McpeClientCacheStatus } from './minecraft/client-cache-status'
import { McpeClientToServerHandshake } from './minecraft/client-to-server-handshake'
import { McpeCreativeContent } from './minecraft/creative-content'
import { EncryptionContext } from './minecraft/encryption/encryption-context'
import { DataPacket } from './minecraft/internal/data-packet'
import { WrapperPacket } from './minecraft/internal/wrapper-packet'
import { McpeItemComponent } from './minecraft/item-component'
import { McpeLogin } from './minecraft/login'
import { McpeMovePlayer } from './minecraft/move-player'
import { McpeNetworkChunkPublisherUpdate } from './minecraft/network-chunk-publisher-update'
import { McpeNetworkSettings } from './minecraft/network-settings'
import { McpePacketViolationWarning } from './minecraft/packet-violation-warning'
import { McpePlayStatus, PlayStatus } from './minecraft/play-status'
import { McpePlayerFog } from './minecraft/player-fog'
import {
  McpePlayerList,
  PlayerListAction,
  PlayerListEntry,
} from './minecraft/player-list'
import { McpeRequestChunkRadius } from './minecraft/request-chunk-radius'
import {
  McpeResourcePackResponse,
  ResourcePackResponse,
} from './minecraft/resource-pack-response'
import { McpeResourcePackStack } from './minecraft/resource-pack-stack'
import { McpeResourcePacksInfo } from './minecraft/resource-packs-info'
import { McpeServerToClientHandshake } from './minecraft/server-to-client-handshake'
import { McpeSetDifficulty } from './minecraft/set-difficulty'
import { McpeSetEntityMetadata } from './minecraft/set-entity-metadata'
import { McpeSetLocalPlayerAsInitialized } from './minecraft/set-local-player-as-initialized'
import { McpeSetSpawnPosition, SpawnType } from './minecraft/set-spawn-position'
import { McpeSetTime } from './minecraft/set-time'
import { McpeStartGame } from './minecraft/start-game'
import { McpeText } from './minecraft/text'
import { McpeTickSync } from './minecraft/tick-sync'
import { McpeUpdateAttributes } from './minecraft/update-attributes'
import { PlayerLoginData } from './player-login-data'
import { Protocol } from './protocol'

/**
 * The class that describes the connection of the player,
 * it manages all packets, decode, encode, send, handles them.
 * It also acts as 'initial' handler for the player session.
 */
export class PlayerConnection {
  private readonly networkSession: NetworkSession
  private readonly player: EntityPlayer

  // More likely connection related
  private cacheSupported: boolean

  // Whatever the client is initialized inside the server
  // so can receive packets and move / etc...
  private initialized = false

  // Just if encryption is enabled
  private encryptionContext: EncryptionContext | null = null

  private wrapperDecodingQueue = new PromiseQueue()
  private outputPacketsQueue: Set<DataPacket> = new Set()

  private sendPacketFn: <T extends DataPacket>(packet: T) => void

  public constructor(session: NetworkSession) {
    this.networkSession = session
    const world = Jukebox.getWorld()
    this.player = new EntityPlayer(world, this)

    // Used to reference when unsubscribing the event
    this.sendPacketFn = this.sendImmediateDataPacket.bind(this)
    Jukebox.getServer().on('global_packet', this.sendPacketFn)
  }

  public process(): void {
    if (this.outputPacketsQueue.size > 0) {
      const wrapper = new WrapperPacket()
      const packetNames: Array<string> = []
      for (const dataPacket of this.outputPacketsQueue) {
        wrapper.addPacket(dataPacket)
        packetNames.push(dataPacket.constructor.name)
        this.outputPacketsQueue.delete(dataPacket)
      }

      if (this.isEncryptionEnabled()) {
        this.encryptWrapper(wrapper).then(encrypted =>
          this.networkSession.sendQueuedBuffer(
            encrypted,
            FrameReliability.RELIABLE_ORDERED
          )
        )
      } else {
        ;(async () => {
          const writeStream = new WriteStream(
            Buffer.allocUnsafe(1024 * 1024 * 2)
          )
          const encoded = await wrapper.internalAsyncEncode(writeStream)
          this.networkSession.sendQueuedBuffer(
            encoded,
            FrameReliability.RELIABLE_ORDERED
          )
        })()
      }

      // Make a user friendly log :)
      const packetNameList = packetNames.join(', ')
      const rinfo = this.networkSession.getRemoteInfo()
      Jukebox.getLogger().debug(
        `Sent McpeWrapper{${packetNameList}} to ${rinfo.address}:${rinfo.port}`
      )
    }
  }

  private handle(buffer: Buffer): void {
    const id = buffer.readUInt8(0)
    const stream = new BinaryStream(buffer)

    switch (id) {
      case Protocol.LOGIN:
        const login = new McpeLogin()
        login.internalDecode(stream)
        this.handleLogin(login)
        break
      case Protocol.CLIENT_CACHE_STATUS:
        const clientCacheStatus = new McpeClientCacheStatus()
        clientCacheStatus.internalDecode(stream)
        this.handleClientCacheStatus(clientCacheStatus)
        break
      case Protocol.CLIENT_TO_SERVER_HANDSHAKE:
        const clientToServerHandshake = new McpeClientToServerHandshake()
        clientToServerHandshake.internalDecode(stream)
        this.handleClientToServerHandshake(clientToServerHandshake)
        break
      case Protocol.RESOURCE_PACK_RESPONSE:
        const resourcePackResponse = new McpeResourcePackResponse()
        resourcePackResponse.internalDecode(stream)
        this.handleResourcePackResponse(resourcePackResponse)
        break
      case Protocol.REQUEST_CHUNK_RADIUS:
        const requestChunkRadius = new McpeRequestChunkRadius()
        requestChunkRadius.internalDecode(stream)
        this.handleRequestChunkRadius(requestChunkRadius)
        break
      case Protocol.TICK_SYNC:
        const tickSync = new McpeTickSync()
        tickSync.internalDecode(stream)
        this.handleTickSync(tickSync)
        break
      case Protocol.SET_LOCAL_PLAYER_AS_INITIALIZED:
        const setLocalPlayerAsInitialized = new McpeSetLocalPlayerAsInitialized()
        setLocalPlayerAsInitialized.internalDecode(stream)
        this.handleSetLocalPlayerAsInitialized(setLocalPlayerAsInitialized)
        break
      case Protocol.TEXT:
        const text = new McpeText()
        text.internalDecode(stream)
        this.handleText(text)
        break
      case Protocol.MOVE_PLAYER:
        const movePlayer = new McpeMovePlayer()
        movePlayer.internalDecode(stream)
        this.handleMovePlayer(movePlayer)
        break
      case Protocol.PACKET_VIOLATION_WARNING:
        const packetViolationWarning = new McpePacketViolationWarning()
        packetViolationWarning.internalDecode(stream)
        this.handlePacketViolationWarning(packetViolationWarning)
        break
      default:
        // TODO: improve this with regex (probably)
        const hexId = id.toString(16)
        Jukebox.getLogger().debug(
          `Handler for packet with id=0x${
            hexId.length > 1 ? hexId : '0' + hexId
          } not implemented! buffer=${buffer.toString('hex')}`
        )
    }
  }

  /** INTERNAL PROTOCOL */

  private addWrapperToDecodingQueue(stream: BinaryStream): void {
    const wrapper = new WrapperPacket()
    this.wrapperDecodingQueue
      .add(() => wrapper.internalAsyncDecode(stream))
      .then(buffers => buffers.forEach(this.handle.bind(this)))
      .catch(Jukebox.getLogger().error)
  }

  public handleDecrypted(buffer: Buffer): void {
    assert(this.encryptionContext != null, 'Failed to initialize encryption')
    const wrapperBuffer = buffer.slice(0, buffer.length - 8)
    const checksum = buffer.slice(buffer.length - 8, buffer.length)
    const computedChecksum = this.encryptionContext.computeDecryptChecksum(
      wrapperBuffer
    )
    const checksumValid = this.encryptionContext.compareChecksum(
      computedChecksum,
      checksum
    )

    assert(
      checksumValid == true,
      `Invalid encrypted packet checksum expected ${
        checksum.toJSON().data
      } computed ${computedChecksum.toJSON().data}`
    )

    const stream = new BinaryStream()
    stream.writeByte(0xfe) // Wrapper header
    stream.write(wrapperBuffer)
    stream.setOffset(0) // Reset offset after writing

    this.addWrapperToDecodingQueue(stream)
  }

  public handleWrapper(stream: BinaryStream): void {
    if (this.isEncryptionEnabled()) {
      assert(this.encryptionContext != null, 'Failed to initialize encryption')
      // Skip the wrapper header and decrypt the "content"
      const buffer = stream.getBuffer().slice(1)
      this.encryptionContext
        .getDecryptionQueue()
        .add(() => this.encryptionContext!.decrypt(buffer))
        .then(this.handleDecrypted.bind(this))
        .catch(Jukebox.getLogger().error)
      return
    }

    this.addWrapperToDecodingQueue(stream)
  }

  public sendQueuedDataPacket<T extends DataPacket>(packet: T): void {
    this.outputPacketsQueue.add(packet)
  }

  private sendImmediateEncryptedWrapper(wrapper: WrapperPacket): void {
    this.encryptWrapper(wrapper)
      .then(encrypted => {
        this.networkSession.sendInstantBuffer(
          encrypted,
          FrameReliability.RELIABLE_ORDERED
        )
      })
      .catch(Jukebox.getLogger().error)
  }

  private async encryptWrapper(wrapper: WrapperPacket): Promise<Buffer> {
    assert(this.encryptionContext != null, 'Failed to initialize encryption!')
    // Encode the buffer and skip the header, theorically should
    // return wrapper header + zlib encoded packets content
    const zippedBuffer = (await wrapper.internalAsyncEncode()).slice(1)
    const checksum = this.encryptionContext.computeEncryptChecksum(zippedBuffer)
    const fullBuffer = Buffer.concat([zippedBuffer, checksum])
    return new Promise((resolve, reject) => {
      this.encryptionContext
        ?.getEncryptionQueue()
        .add(() => this.encryptionContext!.encrypt(fullBuffer))
        .then(encrypted =>
          // Write the wrapper header
          resolve(Buffer.concat([Buffer.from('fe', 'hex'), encrypted]))
        )
        .catch(reject)
    })
  }

  public sendImmediateDataPacket<T extends DataPacket>(packet: T): void {
    const wrapper = new WrapperPacket()
    wrapper.addPacket(packet)
    this.sendImmediateWrapper(wrapper)
  }

  public sendImmediateWrapper(wrapper: WrapperPacket): void {
    if (this.isEncryptionEnabled()) {
      this.sendImmediateEncryptedWrapper(wrapper)
      return
    }

    ;(async () => {
      const writeStream = new WriteStream(Buffer.allocUnsafe(1024 * 1024 * 2))
      const encoded = await wrapper.internalAsyncEncode(writeStream)
      this.networkSession.sendInstantBuffer(
        encoded,
        FrameReliability.RELIABLE_ORDERED
      )
    })()
  }

  /** MINECRAFT HANDLERS */

  private handleLogin(login: McpeLogin): void {
    assert(
      this.initialized == false,
      'Player already exists, handling login twice'
    )
    const gameProtocol = login.gameProtocol
    if (login.gameProtocol != Protocol.MC_PROTOCOL) {
      Jukebox.getLogger().error(
        `Client has protocol version ${gameProtocol}, server requires ${Protocol.MC_PROTOCOL}`
      )
      if (gameProtocol > Protocol.MC_PROTOCOL) {
        const playStatus = new McpePlayStatus()
        playStatus.status = PlayStatus.FAILED_SERVER_OUTDATED
        this.sendImmediateDataPacket(playStatus)
      } else {
        const playStatus = new McpePlayStatus()
        playStatus.status = PlayStatus.FAILED_CLIENT_OUTDATED
        this.sendImmediateDataPacket(playStatus)
      }
      return
    }

    const certData = JSON.parse(login.chainData)
    assert('chain' in certData, 'Failed to decode McpeLogin certificate data')
    const certChainData = certData.chain
    if (!Array.isArray(certChainData)) {
      this.disconnect()
      Jukebox.getLogger().error('Received an invalid McpeLogin certificate')
      return
    }

    const decodedSkinData = decode(login.skinData)
    const extraData = (certChainData
      .map(cert => decode(cert))
      .filter(chain => 'extraData' in (chain as any))[0] as any).extraData

    const playerData = Object.assign(
      {},
      extraData,
      decodedSkinData
    ) as PlayerLoginData

    // Check if the player is already online with the same account
    if (Jukebox.getServer().getOnlinePlayer(playerData.displayName)) {
      // TODO: disconnect
    }

    this.player.setLoginData(playerData)

    Jukebox.getLogger().info(
      `Player ${playerData.displayName} connected with XUID=${playerData.XUID}`
    )

    if (Jukebox.getConfig().encryption != false) {
      const encryption = Jukebox.getEncryption()
      assert(
        encryption != null,
        'Encryption failed to initialize, cannot continue encryption'
      )

      // Each element of the chain contains an element identityPublicKey
      // which is the public key used to sign the next element in the chain
      // The final public key is the public key of the client which is used for protocol encryption
      // All keys are Base64-X509-encoded ECC public keys
      const firstHeader = decode(certChainData[0], { complete: true })
      assert(
        firstHeader != null,
        'Missing client public key, cannot continue encryption'
      )

      let clientRawPubKey = firstHeader.header.x5u
      assert(
        typeof clientRawPubKey === 'string',
        'Client public key is not a string!'
      )
      for (const token of certChainData) {
        const publicKey = createPublicKey({
          key: Buffer.from(clientRawPubKey as string, 'base64'),
          format: 'der',
          type: 'spki',
        })
        const verified = verify(
          token,
          publicKey.export({ format: 'pem', type: 'spki' }),
          {
            algorithms: ['ES384'],
          }
        ) as any
        assert(
          'identityPublicKey' in verified,
          'Missing public key in decoded token'
        )
        clientRawPubKey = verified.identityPublicKey
      }

      // Start encryption phase
      const serverToClientHandshake = new McpeServerToClientHandshake()

      const x509PubKey = Buffer.from(clientRawPubKey as string, 'base64')
      const clientPubKey = createPublicKey({
        key: x509PubKey,
        format: 'der',
        type: 'spki',
      })

      const sharedSecret = encryption.generateSharedSecret(clientPubKey)
      const salt = randomBytes(16)

      // Derive key as salted SHA-256 hash digest
      const encryptionKey = createHash('sha256')
        .update(salt)
        .update(sharedSecret)
        .digest()

      serverToClientHandshake.jwtToken = sign(
        {
          salt: salt.toString('base64'),
        },
        encryption.getPrivateKeyPEM().toString(),
        {
          header: {
            x5u: encryption.getPublicKeyPEM().toString('base64'),
            alg: 'ES384',
          },
        }
      )

      this.sendImmediateDataPacket(serverToClientHandshake)

      // Used to notify that next batches are encrypted
      this.encryptionContext = new EncryptionContext(encryptionKey)
      return
    }

    this.continueLogin()
  }

  private handleClientCacheStatus(packet: McpeClientCacheStatus): void {
    this.cacheSupported = packet.supported
    Jukebox.getLogger().debug(`Client cache support: ${this.cacheSupported}`)
  }

  private handleClientToServerHandshake(
    _packet: McpeClientToServerHandshake
  ): void {
    Jukebox.getLogger().info(
      `Secure connection with ${this.getPlayerInstance().getUsername()} successfully estabilished`
    )

    this.continueLogin()
  }

  private handleResourcePackResponse(packet: McpeResourcePackResponse): void {
    // TODO: proper implementation
    if (packet.status == ResourcePackResponse.HAVE_ALL_PACKS) {
      const resourcePackStack = new McpeResourcePackStack()
      resourcePackStack.forceAccept = false
      resourcePackStack.behaviorPacks = new Array(0)
      resourcePackStack.resourcePacks = new Array(0)
      resourcePackStack.experiments = new Array(0)
      resourcePackStack.alreadyEnabledExperiments = false
      this.sendImmediateDataPacket(resourcePackStack)
    } else if (packet.status == ResourcePackResponse.COMPLETED) {
      this.doInitialSpawn()
    }
  }

  private handleText(packet: McpeText): void {
    Jukebox.getServer().broadcastDataPacket(packet, true)
  }

  private handleMovePlayer(packet: McpeMovePlayer): void {
    this.player.move(packet.position, packet.rotation)
  }

  private handleTickSync(packet: McpeTickSync): void {
    const tickSync = new McpeTickSync()
    tickSync.requestTimestamp = packet.responseTimestamp
    tickSync.responseTimestamp = process.hrtime.bigint()
    this.sendImmediateDataPacket(tickSync)
  }

  private handleRequestChunkRadius(packet: McpeRequestChunkRadius): void {
    this.player.setViewRadius(packet.radius / 2)

    // Send spawn chunks
    this.sendNetworkChunkPublisherUpdate(this.player.getViewRadius())
    this.player.sendNewChunks(6).finally(() => {
      const playStatus = new McpePlayStatus()
      playStatus.status = PlayStatus.PLAYER_SPAWN
      this.sendImmediateDataPacket(playStatus)

      this.spawnClientSide()
    })
  }

  private handleSetLocalPlayerAsInitialized(
    packet: McpeSetLocalPlayerAsInitialized
  ): void {
    assert(
      this.getPlayerInstance().getRuntimeId() == packet.runtimeEntityId,
      'Entity runtime id mismatch, some weird behavior happened!'
    )
    this.initialized = true
  }

  private handlePacketViolationWarning(
    packet: McpePacketViolationWarning
  ): void {
    Jukebox.getLogger().error(`PacketViolationWarning: ${packet.context}`)
  }

  /** MINECRAFT PROTOCOL */

  public doInitialSpawn(): void {
    // BDS first sends McpeInventorySlot (4x), then McpePlayerList

    // Copy the BDS behavior explained inside the function
    const playerListWrapper = this.addToPlayerList()

    const setTime = new McpeSetTime()
    setTime.time = 0 // TODO: from world
    this.sendImmediateDataPacket(setTime)

    const startGame = new McpeStartGame()
    startGame.entityId = this.player.getRuntimeId()
    startGame.runtimeEntityId = this.player.getRuntimeId()

    startGame.playerGamemode = Gamemode.USE_WORLD
    startGame.playerSpawnVector = this.player.getPosition().add(0, 6, 0) // TODO: test purpose

    startGame.pitch = 0
    startGame.yaw = 0

    startGame.seed = 0xdeadbeef
    startGame.biomeType = 0
    startGame.biomeName = 'plains'
    startGame.dimension = Dimension.OVERWORLD
    startGame.generator = Generator.FLAT
    startGame.gamemode = Gamemode.SURVIVAL
    startGame.difficulty = Difficulty.PEACEFUL
    startGame.spawnVector = new Vector3(0, 6, 0)

    startGame.hasAchievementsDisabled = false
    startGame.dayCycleStopTime = 0 // ticks here too

    startGame.eduOffer = 0 // TODO: enum
    startGame.eduFeaturesEnabled = false
    startGame.eduProductId = ''

    startGame.rainLevel = 0
    startGame.lightningLevel = 0

    startGame.hasConfirmedPlatformLockedContent = false

    startGame.isMultiplayer = true
    startGame.lanBroadcast = true
    startGame.xblBroadcastMode = 0
    startGame.platformBroadcastMode = 0

    startGame.commandsEnabled = true
    startGame.texturePacksRequired = false
    startGame.gamerules = new Array(0)
    startGame.experiments = new Array(0)
    startGame.experimentsToggledBefore = false
    startGame.hasBonusChestEnabled = false
    startGame.hasStarterMapEnabled = false
    startGame.permissionLevel = 3
    startGame.chunkTickRange = 4
    startGame.hasLockedBehaviorPack = false
    startGame.hasLockedResourcePack = false
    startGame.isFromLockedWorldTemplate = false
    startGame.onlyMsaGamertags = false
    startGame.isFromWorldTemplate = false
    startGame.isWorldTemplateOptionLocked = false
    startGame.spawnOnlyV1Villagers = false

    startGame.limitedWorldHeight = 0
    startGame.limitedWorldWidth = 0

    startGame.hasNewNether = false
    startGame.forceExperimentalGameplay = false

    startGame.levelId = 'Jukebox Server'
    startGame.worldName = 'Jukebox Server'
    startGame.premiumWorldTemplateId = '00000000-0000-0000-0000-000000000000'

    startGame.isTrial = false
    startGame.movementType = 0
    startGame.rewindHistorySize = 0
    startGame.serverAuthoritativeBlockBreaking = false

    startGame.worldTicks = 0n

    startGame.enchantmentSeed = 0

    startGame.customBlocks = new Array(0)
    startGame.itemPalette = new Array(0)

    startGame.multiplayerCorrelationId = '' // TODO: BDS sends some kind of UUIDv4
    // Soon client-side inventory will be deprecated
    startGame.serverAuthoritativeInventory = true
    startGame.softwareVersion = 'Jukebox v0.0.1'
    this.sendImmediateDataPacket(startGame)

    const itemComponent = new McpeItemComponent()
    itemComponent.components = new Array(0)
    this.sendImmediateDataPacket(itemComponent)

    const setSpawnPosition = new McpeSetSpawnPosition()
    setSpawnPosition.type = SpawnType.PLAYER
    setSpawnPosition.dimension = 3 // BDS sends 3, figure out ?!
    setSpawnPosition.blockPosition = new Vector3(0, 6, 0)
    setSpawnPosition.spawnPosition = new Vector3(0, 6, 0)
    this.sendImmediateDataPacket(setSpawnPosition)

    // BDS sends the time again, maybe to sync it ?!
    this.sendImmediateDataPacket(setTime)

    const setDifficulty = new McpeSetDifficulty()
    setDifficulty.difficutlyLevel = 1 // TODO: enum
    this.sendImmediateDataPacket(setDifficulty)

    // TODO: BDS sends McpeCommandsEnabled (enabled=false)
    // if commands are disabled in config (or cheats are disabled)

    // TODO: better implementation, maybe a class that get ticked and
    // will check for changes, and on changes will update them
    const adventureSetting = new McpeAdventureSettings()
    let actionFlags = 0
    actionFlags |= ActionPermission.BUILD_AND_MINE
    actionFlags |= ActionPermission.USE_DOORS_AND_SWITCHES
    actionFlags |= ActionPermission.OPEN_CONTAINERS
    actionFlags |= ActionPermission.ATTACK_PLAYERS
    actionFlags |= ActionPermission.ATTACK_MOBS
    adventureSetting.flags = AdventureSetting.AUTO_JUMP
    adventureSetting.actionPermission = actionFlags
    adventureSetting.customFlags = 0 // unknown
    adventureSetting.permissionLevel = 1 // member
    adventureSetting.commandPermissionLevel = PermissionLevel.NORMAL
    adventureSetting.uniqueEntityId = this.player.getRuntimeId()
    this.sendImmediateDataPacket(adventureSetting)

    // TODO: BDS sends McpeGameRulesChanged then McpePlayerList
    // (again, this time containing all the entries) and then
    // sends McpeAdventureSettings (again), seems like that is sending
    // other players adventure settings

    this.sendImmediateWrapper(playerListWrapper)

    const biomeDefinitionList = new McpeBiomeDefinitionList()
    this.sendImmediateDataPacket(biomeDefinitionList)

    // TODO: BDS sends McpeAvailableEntityIdentifiers

    const playerFog = new McpePlayerFog()
    playerFog.fogStack = new Array(0)
    this.sendImmediateDataPacket(playerFog)

    const updateAttributes = new McpeUpdateAttributes()
    updateAttributes.uniqueEntityId = this.getPlayerInstance().getRuntimeId()
    updateAttributes.attributes = this.getPlayerInstance().getAttributes()
    this.sendImmediateDataPacket(updateAttributes)

    const creativeContent = new McpeCreativeContent()
    creativeContent.entries = new Array(0)
    this.sendImmediateDataPacket(creativeContent)

    // TODO: BDS sends McpeInventoryContent (x4), then McpePlayerHotbar
    // then McpeCraftingData, then McpeAvailableCommands

    const setActorMetadata = new McpeSetEntityMetadata()
    setActorMetadata.runtimeEntityId = this.getPlayerInstance().getRuntimeId()
    setActorMetadata.metadata = this.getPlayerInstance().getMetadata()
    this.sendImmediateDataPacket(setActorMetadata)

    // After those Login-needed packets, we can start using queues
    // instead of immediatly skipping them and sending the packet
  }

  private continueLogin(): void {
    const playStatus = new McpePlayStatus()
    playStatus.status = PlayStatus.LOGIN_SUCCESS
    this.sendImmediateDataPacket(playStatus)

    const resourcePacksInfo = new McpeResourcePacksInfo()
    resourcePacksInfo.behaviorPacks = new Array(0)
    resourcePacksInfo.resourcePacks = new Array(0)
    resourcePacksInfo.mustAccept = false
    resourcePacksInfo.hasScripts = false
    resourcePacksInfo.forceAccept = false
    this.sendImmediateDataPacket(resourcePacksInfo)

    // According to BDS, this packet is sent
    // It defines the minimum size of a compressed packet
    // If it's 0, all packets are left uncompressed
    const networkSettings = new McpeNetworkSettings()
    networkSettings.compressionThreshold = 1
    this.sendImmediateDataPacket(networkSettings)
  }

  public sendNetworkChunkPublisherUpdate(radius: number): void {
    const networkChunkPublisherUpdate = new McpeNetworkChunkPublisherUpdate()
    networkChunkPublisherUpdate.position = this.player.getPosition().toFloor()
    networkChunkPublisherUpdate.radius = radius * 16
    this.sendImmediateDataPacket(networkChunkPublisherUpdate)
  }

  public sendChunkRadiusUpdated(radius: number): void {
    const chunkRadiusUpdated = new McpeChunkRadiusUpdated()
    chunkRadiusUpdated.radius = radius
    this.sendImmediateDataPacket(chunkRadiusUpdated)
  }

  public addToPlayerList(): WrapperPacket {
    // BDS sends a single entry for each player as i can see, so we do the same
    const sendSingleEntry = (entry: PlayerListEntry): McpePlayerList => {
      const playerList = new McpePlayerList()
      playerList.action = PlayerListAction.ADD
      playerList.listEntries = [entry]
      return playerList
    }

    const entry = new PlayerListEntry(
      this.getPlayerInstance().getUUID(),
      this.getPlayerInstance().getRuntimeId(),
      this.getPlayerInstance().getUsername(),
      this.getPlayerInstance().getSkin(),
      this.getPlayerInstance().getXUID()
    )

    Jukebox.getServer().broadcastDataPacket(sendSingleEntry(entry))
    const serverPlayerList = Jukebox.getServer().getPlayerList()
    serverPlayerList.push(entry)

    // After adding the single player to all online players,
    // send all others online player to this player
    const wrapper = new WrapperPacket()
    for (const entry of serverPlayerList) {
      wrapper.addPacket(sendSingleEntry(entry))
    }
    return wrapper
  }

  public sendUpdatedPlayerList(): void {}

  // TODO: refactor
  public spawnClientSide(): void {
    const player = this.getPlayerInstance()
    const addPlayer = new McpeAddPlayer()
    addPlayer.uuid = player.getUUID()
    addPlayer.username = player.getUsername()
    addPlayer.uniqueEntityId = player.getRuntimeId()
    addPlayer.runtimeEntityId = player.getRuntimeId()
    addPlayer.platformChatId = '' // TODO
    addPlayer.position = player.getPosition()
    addPlayer.motion = new Vector3(0, 0, 0)
    addPlayer.pitch = 0
    addPlayer.yaw = 0
    addPlayer.headYaw = 0
    addPlayer.metadata = player.getMetadata()
    addPlayer.links = new Array(0)
    addPlayer.devideId = '' // TODO
    addPlayer.buildPlatform = -1 // TODO
    const otherPlayers = Jukebox.getServer()
      .getOnlinePlayers()
      .filter(onlinePlayer => !onlinePlayer.getUUID().equals(player.getUUID()))
    for (const otherPlayer of otherPlayers) {
      otherPlayer.getConnection().sendImmediateDataPacket(addPlayer)
    }
  }

  public isEncryptionEnabled(): boolean {
    return this.encryptionContext != null
  }

  public isInitialized(): boolean {
    return this.initialized
  }

  public getPlayerInstance(): EntityPlayer {
    return this.player
  }

  public disconnect(): void {
    Jukebox.getLogger().info(
      `Player ${this.getPlayerInstance().getUsername()} disconnected`
    )
    Jukebox.getServer().removeListener('global_packet', this.sendPacketFn)
    this.player.close()
    // TODO
  }
}
