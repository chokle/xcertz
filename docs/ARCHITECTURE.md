# Architecture

xCertz is a static React client. Phantom controls signing; the client talks directly to Solana devnet RPC. The existing Solana Memo program stores issuance and revocation data. No server, database, NFT, or custom contract is introduced.

| Component | Responsibility |
|---|---|
| `src/core.ts` | Existing v1 memo encoding/decoding, exact revocation match, expiry predicate |
| `src/chain.ts` | Fetch successful issuance, identify issuer signer, paginate and validate revocation evidence |
| `src/App.tsx` | Phantom connection, transaction submission/confirmation, QR/share links and credential state |
| Browser local storage | Last 20 issuer issuance records; not verification authority |
| Solana Memo program | Public append-only signed events |

## Issuance format (unchanged)

Prefix `xcertz:` followed by JSON containing `v:1`, `event:"XCERTZ_ISSUE"`, credential ID, subject wallet, certification, public issuer name, issuer wallet, issuance date, and expiry date. The connected issuer pays and signs the transaction. Issuance is recorded locally only after `confirmTransaction` returns no error.

## Verification

1. Read a confirmed transaction by the URL's `sig` value.
2. Require successful transaction metadata and a Memo instruction.
3. Decode the v1 payload, validate required strings, dates, and public keys.
4. Require the declared issuer to be a transaction signer.
5. Walk the issuer's signature history in pages of 1,000 back to issuance.
6. For candidate revocations, require success, the original issuer as signer, and an exact Memo-program payload `xcertz-revoke:<credentialId>`.
7. Expiry is invalid at or after its UTC timestamp. UI expiry selection is end of the selected UTC day.
8. Validity requires issuer verification, unexpired dates, no revocation, and available proof/history. RPC failure or missing history yields “Not verified.”

The client relies on the RPC's Solana-validated transaction records; it does not separately implement Ed25519 consensus validation. This trust boundary must be represented honestly in demos.

## Revocation

The issuer app verifies its connected address matches the original issuer before requesting Phantom approval. A confirmed exact revocation memo makes the credential invalid. A different signer, a failed transaction, or a prefix collision cannot revoke it.

## Trust and privacy boundaries

The institution's authority is established by an employer outside this MVP; the displayed issuer label alone does not prove accreditation. A share link is bearer access to a public proof, not a subject-authentication assertion. Private worker records are excluded; public metadata and addresses remain linkable and permanent. Never put PII into public free text.

## Repairs made during recovery

Checked unsuccessful confirmations and issuance transactions; tightened required-field/date validation; fixed exact-time expiry; required exact revocation memo and original-issuer signer; removed 100-transaction lookup window; fail closed on incomplete history; handle Phantom account changes; expose the confirmed revocation Explorer link; add share-link copying; use conventional dark-on-white QR contrast. The v1 wire formats remain unchanged.
