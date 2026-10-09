# Crypto World's Fair submission packet

Status: **Prepared copy only; not submitted.** The founder reports an existing xCertz draft, profile Cryptwalker / @Chokle, and Security Tools category. Those signed-in records have not yet been inspected in this environment. Update the existing draft; do not create a duplicate.

## One-liner

xCertz gives skilled-trades workers portable, issuer-signed tickets that employers can verify for authenticity, expiry, and revocation on Solana.

## Product description

xCertz turns a trade-ticket check into a portable verification workflow. An issuer connects Phantom and signs a credential on Solana devnet. The worker carries its share link or QR. An employer opens it independently and checks the signing wallet, expiry, and issuer revocation status. The MVP uses signed Memo transactions and keeps personal-record fields out of the protocol. Its focus is skilled-trades credentials, not a generic identity wallet.

Institution names are self-declared; signing-wallet authenticity is distinct from institutional accreditation. No real-world issuer accreditation or production certification is claimed.

## Blockchain and stack

Solana devnet; existing Solana Memo program; Phantom; Solana web3.js; React 19; TypeScript; Vite; QRCodeSVG. No custom program or token is deployed. The issuer pays devnet transaction fees; verifier reads require no wallet.

## Founder

Derek Chok, Vancouver, Canada. Approximately 20 years in welding, pile driving, and ironwork. Field experience informs the specific credential-verification wedge. Confirm the existing team's membership and mark Canada as primary country before submitting the regional entry.

## Development status

Recovered source independently installed, tested, built, and linted. Four original protocol tests plus four RPC-fixture regression tests pass. Repairs preserve the v1 memo formats. Phantom/devnet acceptance and final video evidence are pending; do not represent fixtures or layout screenshots as real issuance/revocation.

## Demand and distribution

Pre-revenue prototype. Proposed first buyer: a training provider or ticket issuer; employers verify free. Initial validation: one qualification with one issuer and two contractors. Measure verification time, successful verification, expiry/revocation checks, and willingness to pay. No xCertz traction or revenue is claimed.

## Required final assets

- Live demo destination: https://xcertz.cryptwalker.chatgpt.site (deployment must be confirmed before submitting)
- Actual GitHub repository under chokle; public, or review access for hackathon@colosseum.com
- Product graphic: `docs/assets/xcertz-logo.svg`
- Founder presentation video: 2–3 minutes
- Product demo video: no more than 3 minutes, including real issuance, separate-session verification, and revocation
- Confirmed issuance and revocation Explorer URLs plus evidence screenshots

## Deadline and official sources

Official deadline: October 12, 2026, **11:59 p.m. Pacific** (Vancouver); October 13, 2026, 06:59 UTC. Source: section 5 of [World's Fair rules](https://colosseum.com/legal/Crypto%20World's%20Fair%20Hackathon%20Rules.pdf), checked October 9.

[Colosseum submission FAQ](https://colosseum.com/hackathon?year=fall2026) lists a GitHub link, product graphic, 2–3 minute presentation, and demo ≤3 minutes. Check the actual signed-in form for additional required fields.

## Side tracks

[Canada Prize Track](https://superteam.fun/earn/listing/worlds-fair-canada/) is an eligible candidate if the existing Colosseum team marks Canada as primary location and follows global rules. The listing's header uses USDG while its body uses USDC; do not promise a prize denomination without organizer confirmation. Regional submission is not yet made.

The global [Solana ecosystem track](https://colosseum.com/worldsfair) matches the implemented chain and can award alongside overall prizes. Preserve Security Tools as the existing category; do not conflate category with ecosystem track.

Other [Superteam side tracks](https://superteam.fun/earn/hackathon/crypto-worlds-fair) must be checked against their specific eligibility and stacking rules. No other track is confirmed compatible here. Do not add sponsor integrations merely to enter a track. Do not enter another region under false residency or change xCertz's scope.
