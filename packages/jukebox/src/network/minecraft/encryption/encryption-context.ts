import {
  CipherGCM,
  DecipherGCM,
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'crypto'

export class EncryptionContext {
  public static readonly ALGORITHM = 'aes-256-gcm'
  private readonly encryptionKey: Buffer

  public cipher: CipherGCM
  private encryptCounter = 0n

  public decipher: DecipherGCM
  private decryptCounter = 0n

  public constructor(encryptionKey: Buffer) {
    const encryptionIV = encryptionKey.slice(0, 12)
    this.encryptionKey = encryptionKey
    this.cipher = createCipheriv(
      EncryptionContext.ALGORITHM,
      encryptionKey,
      encryptionIV
    )
    this.decipher = createDecipheriv(
      EncryptionContext.ALGORITHM,
      encryptionKey,
      encryptionIV
    )
  }

  public computeEncryptChecksum(buffer: Buffer): Buffer {
    const countIndex = this.encryptCounter++
    return this.computeChecksum(buffer, countIndex)
  }

  public computeDecryptChecksum(buffer: Buffer): Buffer {
    const countIndex = this.decryptCounter++
    return this.computeChecksum(buffer, countIndex)
  }

  private computeChecksum(buffer: Buffer, countIndex: bigint): Buffer {
    const hash = createHash('sha256')
    const counter = Buffer.alloc(8)
    counter.writeBigUInt64LE(countIndex)
    hash.update(counter)
    hash.update(buffer)
    hash.update(this.encryptionKey)
    const digest = hash.digest()
    return digest.slice(0, 8)
  }

  public compareChecksum(checksum1: Buffer, checksum2: Buffer): boolean {
    return checksum1.equals(checksum2)
  }

  public async decrypt(buffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.decipher.update(buffer))
      } catch (err) {
        reject(err)
      }
    })
  }

  public async encrypt(buffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.cipher.update(buffer))
      } catch (err) {
        reject(err)
      }
    })
  }
}
