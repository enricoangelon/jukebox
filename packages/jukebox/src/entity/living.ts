import { World } from '../world/world'
import { Attribute } from './attribute/attribute'
import { AttributeContainer } from './attribute/container'
import { Entity, EntityOptions } from './entity'
import { EntityType } from './type'

export abstract class EntityLiving extends Entity {
  protected attributes: AttributeContainer = new AttributeContainer()

  public constructor(
    type: EntityType,
    world: World,
    options: EntityOptions = {}
  ) {
    super(type, world, options)
    this.initAttributes()
  }

  private initAttributes(): void {
    // Set some entity defaults
    this.attributes.set('minecraft:absorption', new Attribute(0, 16, 0))
    this.attributes.set(
      'minecraft:knockback_resistance',
      new Attribute(0, 1, 0)
    )
    this.attributes.set('minecraft:health', new Attribute(0, 20, 20))
    this.attributes.set(
      'minecraft:movement',
      new Attribute(0, 3.4028235e38, 0.1)
    )
    this.attributes.set(
      'minecraft:underwater_movement',
      new Attribute(0, 3.4028235e38, 0.02)
    )
    this.attributes.set(
      'minecraft:lava_movement',
      new Attribute(0, 3.4028235e38, 0.02)
    )
    this.attributes.set('minecraft:follow_range', new Attribute(0, 2048, 16))
    this.attributes.set('minecraft:attack_damage', new Attribute(0, 1, 1))
    this.initCustomAttributes()
  }

  /**
   * Used to set Entity-related custom attributes.
   * For example EntityPlayer will have its own.
   */
  protected abstract initCustomAttributes(): void

  public getAttributes(): AttributeContainer {
    return this.attributes
  }
}
