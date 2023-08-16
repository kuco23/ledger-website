import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import AvalancheApp from '@avalabs/hw-app-avalanche'

const DERIVATION_PATH = "m/44'/60'/0'/0/0"

export async function getPublicKey(derivationPath = DERIVATION_PATH, hrp?: string): Promise<string> {
	const transport = await TransportWebHID.create()
	const avalanche = new AvalancheApp(transport)
	const resp = await avalanche!.getAddressAndPubKey(derivationPath, false, hrp)
	return resp.publicKey.toString('hex')
}