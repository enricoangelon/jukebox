export class CoordinateUtils {
  public static toHash(array: Array<number>) {
    return `${array[0]}:${array[1]}`
  }
}
