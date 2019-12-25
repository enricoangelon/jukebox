export const Reliability = {
  UNRELIABLE: 0,
  UNRELIABLE_SEQUENCED: 1,
  RELIABLE: 2,
  RELIABLE_ORDERED: 3,
  RELIABLE_SEQUENCED: 4,
  UNRELIABLE_WITH_ACK_RECEIPT: 5,
  RELIABLE_WITH_ACK_RECEIPT: 6,
  RELIABLE_ORDERED_WITH_ACK_RECEIPT: 7,

  isReliable: function(reliability: number) {
    return (
      reliability === this.RELIABLE ||
      reliability === this.RELIABLE_ORDERED ||
      reliability === this.RELIABLE_SEQUENCED ||
      reliability === this.UNRELIABLE_WITH_ACK_RECEIPT ||
      reliability === this.RELIABLE_ORDERED_WITH_ACK_RECEIPT
    )
  },

  isSequenced: function(reliability: number) {
    return (
      reliability === this.UNRELIABLE_SEQUENCED ||
      reliability === this.RELIABLE_SEQUENCED
    )
  },

  isOrdered: function(reliability: number) {
    return (
      reliability === this.RELIABLE_ORDERED ||
      reliability === this.RELIABLE_ORDERED_WITH_ACK_RECEIPT
    )
  },

  isSequencedOrOrdered: function(reliability: number) {
    return (
      reliability === this.UNRELIABLE_SEQUENCED ||
      reliability === this.RELIABLE_ORDERED ||
      reliability === this.RELIABLE_SEQUENCED ||
      reliability === this.RELIABLE_ORDERED_WITH_ACK_RECEIPT
    )
  },
}
