import { getPublicKey } from "./ledger";

const $deriveAddress = document.getElementById('derive-address-button')
const $publicKey = document.getElementById('publicKey')

$deriveAddress!.addEventListener('click', async () => {
  const publicKey = await getPublicKey()
  $publicKey!.appendChild(document.createTextNode(publicKey))
})