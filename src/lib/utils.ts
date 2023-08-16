import * as ethutil from 'ethereumjs-util'
import * as elliptic from "elliptic"
import { bech32 } from 'bech32'

//////////////////////////////////////////////////////////////////////////////////////////
// public keys and bech32 addresses

const EC: typeof elliptic.ec = elliptic.ec
const ec: elliptic.ec = new EC("secp256k1")

export function privateKeyToPublicKeyEncoding(privateKey: string, compress: boolean = true): string {
  const keyPair = ec.keyFromPrivate(privateKey)
  return keyPair.getPublic().encode("hex", compress)
}

export function privateKeyToPublicKey(privateKey: Buffer): Buffer[] {
  const keyPair = ec.keyFromPrivate(privateKey).getPublic()
  const x = keyPair.getX().toBuffer(undefined, 32)
  const y = keyPair.getY().toBuffer(undefined, 32)
  return [x, y]
}

export function decodePublicKey(publicKey: string): Buffer[] {
  let x: Buffer
  let y: Buffer
  publicKey = unPrefix0x(publicKey)
  if (publicKey.length == 128) {
    // ethereum specific public key encoding
    x = Buffer.from(publicKey.slice(0, 64), "hex")
    y = Buffer.from(publicKey.slice(64), "hex")
  } else {
    const keyPair = ec.keyFromPublic(publicKey, 'hex').getPublic()
    x = keyPair.getX().toBuffer(undefined, 32)
    y = keyPair.getY().toBuffer(undefined, 32)
  }
  return [x, y]
}

export function compressPublicKey(x: Buffer, y: Buffer): Buffer {
  return Buffer.from(
    ec.keyFromPublic({
      x: x.toString('hex'),
      y: y.toString('hex')
    }).getPublic().encode("hex", true),
  "hex")
}

function publicKeyToBech32AddressBuffer(x: Buffer, y: Buffer): Buffer {
  const compressed = compressPublicKey(x, y)
  return ethutil.ripemd160(ethutil.sha256(compressed), false)
}

export function publicKeyToBech32AddressString(publicKey: string, hrp: string): string {
  const [pubX, pubY] = decodePublicKey(publicKey)
  const addressBuffer = publicKeyToBech32AddressBuffer(pubX, pubY)
  return `${bech32.encode(hrp, bech32.toWords(addressBuffer))}`
}

export function publicKeyToEthereumAddressString(publicKey: string): string {
  const [pubX, pubY] = decodePublicKey(publicKey)
  const decompressedPubk = Buffer.concat([pubX, pubY])
  const ethAddress = ethutil.publicToAddress(decompressedPubk)
  return prefix0x(ethAddress.toString('hex'))
}

/////////////////////////////////////////////////////////////////////////////////////////
// signatures

export function recoverMessageSigner(message: Buffer, signature: string) {
    const messageHash = ethutil.hashPersonalMessage(message)
    return recoverTransactionSigner(messageHash, signature)
}

export function recoverTransactionSigner(message: Buffer, signature: string) {
    let split = ethutil.fromRpcSig(signature);
    let publicKey = ethutil.ecrecover(message, split.v, split.r, split.s);
    let signer = ethutil.pubToAddress(publicKey).toString("hex");
    return signer;
}

export function recoverPublicKey(message: Buffer, signature: string): Buffer {
  const split = ethutil.fromRpcSig(signature)
  return ethutil.ecrecover(message, split.v, split.r, split.s)
}

//////////////////////////////////////////////////////////////////////////////////////////
// general helper functions

export function unPrefix0x(tx: string) {
  if (!tx) {
    return '0x0'
  }
  return tx.startsWith('0x') ? tx.slice(2) : tx
}

export function prefix0x(hexString: string) {
  return hexString.startsWith("0x") ? hexString : "0x" + unPrefix0x(hexString)
}