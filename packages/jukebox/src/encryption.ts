import { Ber, BerReader, BerWriter } from 'asn1'
import { ECDH, createECDH } from 'crypto'

import { ec as EC } from 'elliptic'
import KeyEncoder from 'key-encoder'

export class Encryption {
  public static readonly CURVE = 'secp384r1'
  private readonly serverKeyPair: ECDH
  private readonly keyEncoder: KeyEncoder

  public constructor() {
    // First generate a ECDSA key pair using secp384r1 curve
    this.serverKeyPair = createECDH(Encryption.CURVE)
    this.serverKeyPair.generateKeys()

    // NodeJS's EC support lack, I'm gonna write some rust bindings soon
    this.keyEncoder = new KeyEncoder({
      // Curve OID: http://oid-info.com/get/1.3.132.0.34
      curveParameters: [1, 3, 132, 0, 34],
      privatePEMOptions: { label: 'EC PRIVATE KEY' },
      publicPEMOptions: { label: 'PUBLIC KEY' },
      curve: new EC('p384'),
    })
  }

  public generateSharedSecret(clientB64PublicKey: string): Buffer {
    const publicKey = this.readX509PublicKey(clientB64PublicKey)
    return this.serverKeyPair.computeSecret(publicKey)
  }

  public getPrivateKeyPEM(): string {
    const rawPrivateKey = this.serverKeyPair.getPrivateKey('hex')
    return this.keyEncoder.encodePrivate(rawPrivateKey, 'raw', 'pem')
  }

  public getPublicKeyX509(): string {
    return this.writeX509PublicKey(this.serverKeyPair.getPublicKey())
  }

  public static rawToPem(base64key: string): string {
    return [
      '-----BEGIN PUBLIC KEY-----',
      base64key,
      '-----END PUBLIC KEY-----',
    ].join('\n')
  }

  // Replace that trash mess with a library
  private writeX509PublicKey(key: Buffer): string {
    const writer = new BerWriter()
    // sequence(sequence(object identifier, object identifier), bit string)
    writer.startSequence()
    writer.startSequence()
    writer.writeOID('1.2.840.10045.2.1', Ber.OID) //  1.2.840.10045.2.1 ecPublicKey (ANSI X9.62 public key type)
    writer.writeOID('1.3.132.0.34', Ber.OID) // 1.3.132.0.34 secp384r1 (SECG (Certicom) named elliptic curve)
    writer.endSequence()
    writer.writeBuffer(Buffer.concat([Buffer.from([0x00]), key]), Ber.BitString)
    writer.endSequence()
    return writer.buffer.toString('base64')
  }

  private readX509PublicKey(key: string): Buffer {
    const buffer = Buffer.from(key, 'base64')
    const reader = new BerReader(buffer)
    reader.readSequence()
    reader.readSequence()
    reader.readOID()
    reader.readOID()
    return Buffer.from(reader.readString(Ber.BitString, true)).slice(1)
  }
}
