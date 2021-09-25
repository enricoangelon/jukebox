import { Vector3 } from '../math/vector3'
import { World } from '../world/world'
import { EntityFlag } from './flag'
import { MetadataContainer } from './metadata/container'
import { MetadataFlags } from './metadata/flags'
import { EntityType } from './type'

export interface EntityOptions {
  position?: Vector3
}

export class Entity {
  public static runtimeCount = 0n

  protected readonly world: World
  private readonly runtimeId: bigint
  protected position: Vector3
  protected readonly metadata = new MetadataContainer()

  public constructor(
    type: EntityType,
    world: World,
    options: EntityOptions = {}
  ) {
    this.runtimeId = ++Entity.runtimeCount
    this.world = world
    this.position = options.position ?? new Vector3()

    // Some defaults
    this.metadata.setLong(MetadataFlags.INDEX, 0n)
    this.setScale(1.0)

    this.setCollision(true)
    this.setAffectedByGravity(true)
    this.setNametagVisible(true)
  }

  public setAffectedByGravity(value: boolean): void {
    this.metadata.setDataFlag(
      MetadataFlags.INDEX,
      EntityFlag.AFFECTED_BY_GRAVITY,
      value
    )
  }

  public setCollision(value: boolean): void {
    this.metadata.setDataFlag(
      MetadataFlags.INDEX,
      EntityFlag.HAS_COLLISION,
      value
    )
  }

  public setScale(scale: number): void {
    this.metadata.setFloat(MetadataFlags.SCALE, scale)
  }

  public setNametagVisible(value: boolean): void {
    this.metadata.setDataFlag(
      MetadataFlags.INDEX,
      EntityFlag.CAN_SHOW_NAMETAG,
      value
    )
  }

  public tick(currentTick: number): void {}

  public move(position: Vector3, rotation: Vector3): void {
    this.position = position
    // TODO: rotation
  }

  public getWorld(): World {
    return this.world
  }

  public getRuntimeId(): bigint {
    return this.runtimeId
  }

  public getPosition(): Vector3 {
    return this.position
  }

  public getMetadata(): MetadataContainer {
    return this.metadata
  }
}
