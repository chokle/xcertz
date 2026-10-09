import { describe, expect, it, vi } from 'vitest'
import { Connection, Keypair } from '@solana/web3.js'
import { checkRevoked, extractCredential, MEMO_PROGRAM } from './chain'
import { encodeIssueMemo, encodeRevokeMemo, type CredentialPayload } from './core'

const issuer = Keypair.generate().publicKey
const other = Keypair.generate().publicKey
const payload: CredentialPayload = {
 v:1,event:'XCERTZ_ISSUE',credentialId:'cred-123',subjectWallet:other.toBase58(),
 certification:'Welder',issuerName:'Test institution',issuerWallet:issuer.toBase58(),
 issuedAt:'2026-10-09T00:00:00Z',expiresAt:'2027-10-09T00:00:00Z',
}
const memo = encodeRevokeMemo(payload.credentialId)
function tx(text: string, signer = issuer, err: unknown = null) {
 return {meta:{err},transaction:{message:{accountKeys:[{pubkey:signer,signer:true}],instructions:[{programId:MEMO_PROGRAM,parsed:text}]}}}
}
function rpc(pages: unknown[][], transaction = tx(memo)) {
 const getSignaturesForAddress = vi.fn()
 pages.forEach(page=>getSignaturesForAddress.mockResolvedValueOnce(page))
 const getParsedTransaction = vi.fn().mockResolvedValue(transaction)
 return {getSignaturesForAddress,getParsedTransaction} as unknown as Connection
}
describe('RPC verification regressions (fixtures, not devnet acceptance)',()=>{
 it('requires a successful issuance and the declared issuer signer',async()=>{
  expect((await extractCredential(rpc([],tx(encodeIssueMemo(payload))), 'issue')).issuerVerified).toBe(true)
  expect((await extractCredential(rpc([],tx(encodeIssueMemo(payload),other)), 'issue')).issuerVerified).toBe(false)
  await expect(extractCredential(rpc([],tx(encodeIssueMemo(payload),issuer,{InstructionError:[]})), 'issue')).rejects.toThrow(/did not succeed/)
 })
 it('checks beyond the first history page',async()=>{
  const first=Array.from({length:1000},(_,i)=>({signature:'new-'+i,memo:null,err:null}))
  const connection=rpc([first,[{signature:'revoke',memo,err:null},{signature:'issue',memo:null,err:null}]])
  expect(await checkRevoked(connection,issuer,'issue',payload.credentialId)).toBe(true)
  expect(connection.getSignaturesForAddress).toHaveBeenNthCalledWith(2,issuer,{limit:1000,before:'new-999'},'confirmed')
 })
 it('ignores failed revocations and requires the original issuer to sign',async()=>{
  expect(await checkRevoked(rpc([[{signature:'bad',memo,err:{}},{signature:'issue',memo:null,err:null}]]),issuer,'issue',payload.credentialId)).toBe(false)
  expect(await checkRevoked(rpc([[{signature:'spoof',memo,err:null},{signature:'issue',memo:null,err:null}]],tx(memo,other)),issuer,'issue',payload.credentialId)).toBe(false)
 })
 it('requires an exact revocation memo and fails closed on missing history',async()=>{
  expect(await checkRevoked(rpc([[{signature:'revoke',memo:memo+'-other',err:null},{signature:'issue',memo:null,err:null}]],tx(memo+'-other')),issuer,'issue',payload.credentialId)).toBe(false)
  await expect(checkRevoked(rpc([[]]),issuer,'issue',payload.credentialId)).rejects.toThrow(/history is unavailable/)
 })
})
