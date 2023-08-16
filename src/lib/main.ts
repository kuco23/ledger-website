import { getAccount, getSignature } from "./ledger";

const $deriveAddress = document.getElementById('derive-address-button')
const $address = document.getElementById('address')
const $publicKey = document.getElementById('publicKey')

$deriveAddress!.addEventListener('click', async () => {
  const { publicKey, address } = await getAccount()
  $address!.appendChild(document.createTextNode(address))
  $publicKey!.appendChild(document.createTextNode(publicKey))
})