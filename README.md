# xCertz

Portable, verifiable skilled-trades credentials on Solana devnet.

**Trade-ticket issuance → worker possession of a share link → employer verification → expiry/revocation.**

## Run

Node.js 22.12+ (Node 24 also supported). React 19, TypeScript, Vite, Solana web3.js.

```sh
npm ci
npm test
npm run build
npm run lint
npm run dev
```

The checked-in lockfile records the recovered dependencies. No backend, private key, API secret, token mint, or custom Solana program is required.

## Use the demo

1. Open the demo inside Phantom's browser on mobile, or a desktop browser with Phantom installed. Select **Solana devnet** in Phantom and use an issuer wallet funded with devnet SOL.
2. Connect the issuer. Enter a public institution name, qualification, worker public address, and future expiry. Never enter personal names, DOB, contact details, addresses, or personal ticket numbers.
3. Click **Issue on Solana**. Approve the actual Memo transaction in Phantom. xCertz waits for confirmed chain success.
4. Copy the share link or scan the QR from a separate browser/session. No wallet or local issuer storage is needed to verify.
5. Inspect the issuer signer, expiry, and current revocation state. Follow the Solana Explorer link with `cluster=devnet`.
6. From the original issuer's browser, click **Revoke** for that credential. Approve the revocation transaction with the original issuer wallet. Save its Explorer link.
7. Re-open or re-verify the original share link in the other session. It must show **CREDENTIAL NOT VALID / Revoked by issuer**.

The **Demo address** button generates an address only and discards its key. It is for layout/testing convenience; use a worker-controlled address for the real acceptance flow.

## What the proof means

A successful Memo transaction binds the payload to its declared issuer wallet through Solana's verified transaction signature. It proves that wallet signed; an institution name is self-declared. Employers must independently establish that the issuer public key belongs to an authorized institution. There is no issuer accreditation registry in this MVP.

The QR is a public verification link, not authentication or proof the presenter controls the subject wallet. Worker wallet possession challenges are outside the locked MVP scope.

## Privacy

No personal-record fields are included. Public wallet addresses, qualification, public issuer name, dates, and credential ID are stored in permanent public memo data. Wallet addresses are linkable pseudonyms; this is not anonymity. The app warns users not to place PII in its free-text fields. Revocation does not erase the original record.

## Verification and limitations

The recovered source's original four protocol tests were rerun successfully. Four additional RPC-fixture regression tests cover unsuccessful issuance, signer mismatch, paginated revocations, failed/forged revocations, exact memo matching, and unavailable history. These are automated tests, **not** Phantom/devnet acceptance evidence.

Desktop (1440px) and mobile (375px, 390px) layouts were rendered and visually inspected; automated checks found no horizontal overflow or browser runtime errors, and missing-Phantom feedback works. Evidence is in `docs/assets/layout-*.png` and `docs/layout-qa.json`.

To repeat layout QA, run `npm run build`, `npx playwright install chromium`, then `npm run qa:layout`. An already installed Chromium binary may be supplied using `XCERTZ_BROWSER_EXECUTABLE`. The script serves build output internally for automated QA.

Build passes. Source lint passes. Vite reports a non-blocking >500 kB bundle warning. Public RPC availability, rate limits, indexing delays, and devnet history retention can affect verification; unverifiable history reports an error rather than a valid credential.

Device-local storage keeps the issuer's latest 20 issuance records. Clearing it loses the local list; the chain proof/share URL remains independently verifiable. This prototype is for devnet demonstration, not production trade certification.

See [architecture](docs/ARCHITECTURE.md), [acceptance checklist](docs/ACCEPTANCE.md), [business case](docs/BUSINESS_CASE.md), and [submission packet](docs/SUBMISSION.md).

## Recovery provenance

Recovered from `xCertz-recovery.zip`, reconstructed by the founder's earlier ChatGPT thread. Historical checks were not treated as evidence. This continuation preserved the v1 `xcertz:` issuance and `xcertz-revoke:` revocation formats while repairing verification failures.
