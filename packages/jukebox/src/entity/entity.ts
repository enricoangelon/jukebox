import { Vector3 } from '../math/vector3'
import { World } from '../world/world'

export interface EntityOptions {
  position?: Vector3
}

export class Entity {
  public static runtimeCount = 0n

  protected world: World
  private runtimeId: bigint
  protected position: Vector3

  public constructor(type: string, world: World, options: EntityOptions = {}) {
    this.runtimeId = Entity.runtimeCount++
    this.world = world
    this.position = options.position ?? new Vector3()
  }

  public tick(timestamp: number): void {}

  public getRuntimeId(): bigint {
    return this.runtimeId
  }

  public getPosition(): Vector3 {
    return this.position
  }
}
