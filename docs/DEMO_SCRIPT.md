# Demo script — target 2 minutes 40 seconds

This is a recording script, not a recorded demo. Show real Phantom/devnet activity. Record approvals without exposing secrets. Cut network waiting time only when the final confirmed result remains visible.

| Time | Narration | Screen/evidence |
|---|---|---|
| 0:00–0:20 | “I'm Derek, a tradesman with around 20 years in the field. xCertz solves one specific check: did the right issuer sign this worker's ticket, is it current, and has it been revoked?” | xCertz page and devnet label |
| 0:20–0:55 | “The issuer connects Phantom, chooses the worker's public address and expiry, then signs on Solana. No worker name or personal record goes in the memo.” | Real wallet connection, credential fields, Phantom approval, confirmed issuance |
| 0:55–1:15 | “This is the confirmed transaction, with the issuer's signature and credential memo.” | Real issuance Explorer transaction; success and signing wallet |
| 1:15–1:45 | “The worker carries this QR or share link. I open it in a different session. The employer doesn't need my browser storage or a wallet to check the proof.” | Copy share link; separate session valid state; issuer and expiry |
| 1:45–2:15 | “If the issuer withdraws the ticket, the same issuer wallet signs a revocation. This is the confirmed revocation transaction.” | Original issuer revokes; real Phantom approval and Explorer link |
| 2:15–2:35 | “The original QR hasn't changed. Refreshing it now returns revoked and invalid.” | Original URL in independent session showing revoked |
| 2:35–2:40 | “Portable trade-ticket proof. Issuance, possession, verification, expiry, and revocation.” | Final xCertz frame |

## Presentation video — separate 2–3 minute recording

Lead with the field problem and founder experience. Explain the issuer buyer, free employer verification, one-issuer/two-contractor validation plan, and Solana's signed public audit trail. State the product is a devnet prototype. Close with the skilled-trades lifecycle and what will establish demand. Do not claim customers, partnerships, recognized accreditation, or revenue.

## Evidence captures

1. Desktop and 375/390px mobile page (layout only).
2. Successful real issuance with full signature/Explorer link.
3. Independent valid verification, visible signing address and expiry.
4. Successful real revocation with Explorer link.
5. Same original share URL reporting revoked/invalid.

A prerecorded fixture, random transaction signature, or UI-only video cannot replace steps 2–5.
