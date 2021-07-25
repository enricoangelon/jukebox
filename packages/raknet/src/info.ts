export const Info = {
  PROTOCOL: 10,
  MAGIC: Buffer.from(
    '\x00\xff\xff\x00\xfe\xfe\xfe\xfe\xfd\xfd\xfd\xfd\x12\x34\x56\x78',
    'binary'
  ),

  IPV4: 4,
  IPV6: 6,
  AF_INET6: 10,
  RAKNET_TICK_TIME: 50,
}
