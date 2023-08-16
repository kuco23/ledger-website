import * as ethutil from 'ethereumjs-util'
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import AvalancheApp from '@avalabs/hw-app-avalanche'
import * as utils from './utils'

const DERIVATION_PATH = "m/44'/60'/0'/0/0"

function encodePublicKey(pubk: string) {
	const [x, y] = utils.decodePublicKey(pubk)
	return utils.compressPublicKey(x, y).toString('hex')
}

export async function getAccount(derivationPath = DERIVATION_PATH, hrp?: string): Promise<{
	publicKey: string,
	address: string,
	ethereumAddress: string
}> {
	const transport = await TransportWebHID.create()
	const avalanche = new AvalancheApp(transport)
	const resp = await avalanche!.getAddressAndPubKey(derivationPath, false, hrp)
	const pubkHex = resp.publicKey.toString('hex')
	return {
		publicKey: pubkHex,
		address: resp.address,
		ethereumAddress: utils.publicKeyToEthereumAddressString(pubkHex)
	}
}

export async function getSignature(message: string, blind = true, derivationPath = DERIVATION_PATH): Promise<{
	signature: string,
	publicKey: string,
	address: string
}> {
	// message is a hexadecimal (if blind, then message is hashed data, else it is data buffer)
	message = utils.unPrefix0x(message)
	const messageBuf = Buffer.from(message, 'hex')
	const messageHash = blind ? messageBuf : ethutil.sha256(messageBuf)
	// extract account and sign paths from the derivation path
	const pathSplit = derivationPath.split('/')
	const accountPath = pathSplit.slice(0, 4).join('/')
	const signPath = pathSplit.slice(4).join('/')
	// setup avalanche ledger app communication channel
	const transport = await TransportWebHID.create()
	const avalanche = new AvalancheApp(transport)
	// sign message
	const resp = await (blind ? avalanche.signHash : avalanche.sign)(accountPath, [signPath], messageBuf)
	const signature = utils.prefix0x(resp.signatures!.get(signPath)!.toString('hex'))
	const pubk = utils.recoverPublicKey(messageHash, signature)
	const addr = utils.recoverTransactionSigner(messageHash, signature)
	return {
		signature: signature,
		publicKey: encodePublicKey(pubk.toString('hex')),
		address: addr
	}
}