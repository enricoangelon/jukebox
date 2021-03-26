// Collection of frame bit flags found
// in the frame-set-packet header
export enum FrameFlags {
  SPLIT = 0x10,
  NACK = 0x20,
  ACK = 0x40,
  VALID = 0x80,
}
