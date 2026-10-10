# Real Phantom / Solana devnet acceptance

Status: **PARTIAL: real devnet issuance succeeded and issuer signing was checked independently.** See [issuance evidence](ISSUANCE_EVIDENCE.md). Real revocation is now independently checked at finalized commitment; the user's screenshot shows revoked/invalid. See [revocation evidence](REVOCATION_EVIDENCE.md). A second real credential is finalized, unexpired and not revoked as of the independent history check, and is visibly valid in the user's separate Chrome session. See [valid credential evidence](VALID_CREDENTIAL_EVIDENCE.md). The valid and revoked screenshots show different credentials; a same-credential Chrome before/after capture is not evidenced. Do not substitute fixture transactions, random signatures, or generated Explorer URLs for chain evidence.

| Gate | Required evidence |
|---|---|
| Issuer connected | Screenshot of wallet address on the public demo; wallet set to devnet |
| Issue | Successful Phantom approval and confirmed signature; Explorer shows success and memo |
| Independent verification | Original URL in a separate session/device; valid state, declared issuer as signer, correct subject/expiry |
| Revoke | Original issuer approves actual revocation; confirmed revocation Explorer link |
| Invalid | Refresh original URL in the independent session; revoked/invalid state |
| Expiry | Automated boundary regression passes; do not describe this as a live expired-credential test |

Use public synthetic qualification metadata and a worker-controlled devnet address. Keep private keys and recovery phrases out of every artifact. Save full issuance/revocation signatures, Explorer URLs, verification URL, confirmation times, and screenshots here after checking them on chain.

Public RPC can take time to index a confirmed transaction. Retry verification when indexing is pending; do not mark an unindexed transaction valid. Keep the issuer session's local issuance record until revocation is complete.
