export class Vector3 {
  private x: number
  private y: number
  private z: number

  public constructor(x = 0, y = 0, z = 0) {
    this.x = x
    this.y = y
    this.z = z
  }

  public toFloor(): Vector3 {
    this.x = Math.floor(this.x)
    this.y = Math.floor(this.y)
    this.z = Math.floor(this.z)
    return this
  }

  public add(x: number, y: number, z: number): Vector3 {
    this.x += x
    this.y += y
    this.z += z
    return this
  }

  public getX(): number {
    return this.x
  }

  public getY(): number {
    return this.y
  }

  public getZ(): number {
    return this.z
  }
}
