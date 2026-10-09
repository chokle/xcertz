import { Connection, PublicKey } from '@solana/web3.js'
import { Buffer } from 'buffer'
import bs58 from 'bs58'
import { decodeIssueMemo, encodeRevokeMemo, hasRevocationMemo } from './core'
export const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
export async function extractCredential(connection: Connection, signature: string) {
  const tx = await connection.getParsedTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  })
  if (!tx) throw new Error('Transaction not found or not yet indexed.')
  if (!tx.meta || tx.meta.err) throw new Error('Issuance transaction did not succeed.')

  let memo = ''
  for (const ix of tx.transaction.message.instructions) {
    if (!('programId' in ix) || !ix.programId.equals(MEMO_PROGRAM)) continue
    if ('parsed' in ix) {
      memo = typeof ix.parsed === 'string' ? ix.parsed : JSON.stringify(ix.parsed)
    } else if ('data' in ix) {
      memo = Buffer.from(bs58.decode(ix.data)).toString('utf8')
    }
  }

  const payload = decodeIssueMemo(memo)
  new PublicKey(payload.subjectWallet)
  new PublicKey(payload.issuerWallet)
  const signerKeys = tx.transaction.message.accountKeys
    .filter((key) => key.signer)
    .map((key) => key.pubkey.toBase58())

  return { tx, payload, issuerVerified: signerKeys.includes(payload.issuerWallet) }
}

export async function checkRevoked(connection: Connection, issuer: PublicKey, issuanceSignature: string, credentialId: string) {
  let revoked = false
  let before: string | undefined
  // Scan every page back to issuance; a recent-history window can miss revocations.
  while (true) {
    const history = await connection.getSignaturesForAddress(issuer, { limit: 1000, before }, 'confirmed')
    for (const item of history) {
      if (item.err || !item.memo?.includes(encodeRevokeMemo(credentialId))) continue
      const revokeTx = await connection.getParsedTransaction(item.signature, {
        commitment: 'confirmed', maxSupportedTransactionVersion: 0,
      })
      if (!revokeTx?.meta || revokeTx.meta.err) throw new Error('Revocation proof could not be checked. Retry verification.')
      const signedByIssuer = revokeTx.transaction.message.accountKeys.some(
        key => key.signer && key.pubkey.equals(issuer),
      )
      const revokeMemos = revokeTx.transaction.message.instructions
        .filter(ix => ix.programId.equals(MEMO_PROGRAM))
        .map(ix => 'parsed' in ix && typeof ix.parsed === 'string'
          ? ix.parsed : 'data' in ix ? Buffer.from(bs58.decode(ix.data)).toString('utf8') : null)
      if (signedByIssuer && hasRevocationMemo(revokeMemos, credentialId)) revoked = true
    }
    if (revoked || history.some(item => item.signature === issuanceSignature)) break
    if (history.length < 1000) throw new Error('Complete credential history is unavailable. Cannot confirm current validity.')
    before = history[history.length - 1].signature
  }
  return revoked
}
