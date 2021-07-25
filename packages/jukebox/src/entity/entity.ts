import { Vector3 } from '../math/vector3'
import { World } from '../world/world'
import { EntityType } from './entity-type'

export interface EntityOptions {
  position?: Vector3
}

export class Entity {
  public static runtimeCount = 0n

  protected world: World
  private runtimeId: bigint
  public position: Vector3 // todo: protected

  public constructor(
    type: EntityType,
    world: World,
    options: EntityOptions = {}
  ) {
    this.runtimeId = ++Entity.runtimeCount
    this.world = world
    this.position = options.position ?? new Vector3()
  }

  public tick(timestamp: number): void {}

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
}
