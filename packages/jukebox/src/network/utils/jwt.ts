export class JWT {
  public static decodeJWT(chain: string) {
    // to optimize
    let [, payloadB64] = chain.split('.')
    let fixedPayload = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(Buffer.from(fixedPayload, 'base64').toString())
  }
}
