import { diffieHellman, generateKeyPairSync, KeyObject } from 'crypto'

export class Encryption {
  public static readonly CURVE = 'secp384r1'
  private privateKey: KeyObject
  private publicKey: KeyObject

  public constructor() {
    // First generate a ECDSA key pair using secp384r1 curve
    const serverKeyPair = generateKeyPairSync('ec', {
      namedCurve: Encryption.CURVE,
    })
    this.privateKey = serverKeyPair.privateKey
    this.publicKey = serverKeyPair.publicKey
  }

  public generateSharedSecret(clientPublicKey: KeyObject): Buffer {
    return diffieHellman({
      privateKey: this.privateKey,
      publicKey: clientPublicKey,
    })
  }

  public getPublicKeyPEM(): Buffer | string {
    return this.publicKey.export({ format: 'der', type: 'spki' })
  }

  public getPrivateKeyPEM(): Buffer | string {
    return this.privateKey.export({ format: 'pem', type: 'sec1' })
  }
}
