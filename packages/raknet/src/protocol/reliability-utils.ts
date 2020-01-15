import { PacketReliability } from './reliability'

export class ReliabilityUtils {
  public static isReliable(reliability: number) {
    return (
      reliability === PacketReliability.RELIABLE ||
      reliability === PacketReliability.RELIABLE_ORDERED ||
      reliability === PacketReliability.RELIABLE_SEQUENCED ||
      reliability === PacketReliability.UNRELIABLE_WITH_ACK_RECEIPT ||
      reliability === PacketReliability.RELIABLE_ORDERED_WITH_ACK_RECEIPT
    )
  }

  public static isSequenced(reliability: number) {
    return (
      reliability === PacketReliability.UNRELIABLE_SEQUENCED ||
      reliability === PacketReliability.RELIABLE_SEQUENCED
    )
  }

  public static isOrdered(reliability: number) {
    return (
      reliability === PacketReliability.RELIABLE_ORDERED ||
      reliability === PacketReliability.RELIABLE_ORDERED_WITH_ACK_RECEIPT
    )
  }

  public static isSequencedOrOrdered(reliability: number) {
    return (
      reliability === PacketReliability.UNRELIABLE_SEQUENCED ||
      reliability === PacketReliability.RELIABLE_ORDERED ||
      reliability === PacketReliability.RELIABLE_SEQUENCED ||
      reliability === PacketReliability.RELIABLE_ORDERED_WITH_ACK_RECEIPT
    )
  }
}
