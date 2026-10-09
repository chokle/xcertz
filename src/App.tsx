import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from '@solana/web3.js'
import { Buffer } from 'buffer'
import { QRCodeSVG } from 'qrcode.react'
import {
  Award,
  Ban,
  Building2,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  HardHat,
  Link2,
  Loader2,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import {
  encodeIssueMemo,
  encodeRevokeMemo,
  isExpiredAt,
  type CredentialPayload,
} from './core'
import './App.css'

type PhantomProvider = {
  isPhantom?: boolean
  publicKey?: PublicKey
  connect: () => Promise<{ publicKey: PublicKey }>
  disconnect?: () => Promise<void>
  on?: (event: string, listener: (publicKey?: PublicKey | null) => void) => void
  removeListener?: (event: string, listener: (publicKey?: PublicKey | null) => void) => void
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>
}

declare global {
  interface Window {
    solana?: PhantomProvider
  }
}

type SavedCredential = {
  signature: string
  payload: CredentialPayload
}

type VerificationResult = {
  signature: string
  payload?: CredentialPayload
  issuerVerified: boolean
  revoked: boolean
  expired: boolean
  blockTime?: number | null
  error?: string
}

import { MEMO_PROGRAM, extractCredential, checkRevoked } from './chain'
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

function short(value?: string, chars = 5) {
  if (!value) return '—'
  return value.length > chars * 2 + 3
    ? `${value.slice(0, chars)}…${value.slice(-chars)}`
    : value
}

function defaultExpiry() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 2)
  return d.toISOString().slice(0, 10)
}

function nowIso() {
  return new Date().toISOString()
}

function endOfDayIso(date: string) {
  return new Date(`${date}T23:59:59Z`).toISOString()
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}


function App() {
  const [wallet, setWallet] = useState<string>('')
  const [issuerName, setIssuerName] = useState('Pacific Trades Academy')
  const [subjectWallet, setSubjectWallet] = useState('')
  const [certification, setCertification] = useState('Red Seal Welder — FCAW / SMAW')
  const [expiresAt, setExpiresAt] = useState(defaultExpiry())
  const [busy, setBusy] = useState<'connect' | 'issue' | 'verify' | 'revoke' | null>(null)
  const [notice, setNotice] = useState('')
  const [verifySig, setVerifySig] = useState(
    () => new URLSearchParams(window.location.search).get('sig') ?? '',
  )
  const [verified, setVerified] = useState<VerificationResult | null>(null)
  const [saved, setSaved] = useState<SavedCredential[]>(() => {
    try {
      const raw = localStorage.getItem('xcertz-issued')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [copied, setCopied] = useState('')
  const [revocationSignature, setRevocationSignature] = useState('')

  useEffect(() => {
    const provider = window.solana
    const changed = (key?: PublicKey | null) => {
      setWallet(key?.toBase58() ?? '')
      setVerified(null)
    }
    provider?.on?.('accountChanged', changed)
    provider?.on?.('disconnect', changed)
    return () => {
      provider?.removeListener?.('accountChanged', changed)
      provider?.removeListener?.('disconnect', changed)
    }
  }, [])

  const latest = saved[0]
  const verifyUrl = useMemo(() => {
    if (!latest?.signature) return ''
    return `${window.location.origin}${window.location.pathname}?sig=${latest.signature}`
  }, [latest])

  async function connectWallet() {
    setBusy('connect')
    setNotice('')
    try {
      const provider = window.solana
      if (!provider?.isPhantom) {
        throw new Error('Phantom wallet was not detected. Install or open Phantom, then retry.')
      }
      const response = await provider.connect()
      setWallet(response.publicKey.toBase58())
      if (!subjectWallet) setSubjectWallet(response.publicKey.toBase58())
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Wallet connection failed.')
    } finally {
      setBusy(null)
    }
  }

  async function sendMemo(memo: string) {
    const provider = window.solana
    if (!provider?.publicKey) throw new Error('Connect the issuer wallet first.')
    if (provider.publicKey.toBase58() !== wallet) throw new Error('Issuer wallet changed. Reconnect before signing.')

    const latestBlockhash = await connection.getLatestBlockhash('confirmed')
    const tx = new Transaction({
      feePayer: provider.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
    })
    tx.add(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM,
        data: Buffer.from(memo, 'utf8'),
      }),
    )
    const { signature } = await provider.signAndSendTransaction(tx)
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      'confirmed',
    )
    if (confirmation.value.err) throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
    return signature
  }

  async function issueCredential() {
    setBusy('issue')
    setNotice('')
    try {
      if (!wallet) throw new Error('Connect an issuer wallet first.')
      new PublicKey(subjectWallet)
      if (!issuerName.trim() || !certification.trim() || !expiresAt) {
        throw new Error('Issuer, certification, worker address, and expiry are required.')
      }

      if (isExpiredAt(endOfDayIso(expiresAt))) throw new Error('Expiry must be in the future.')

      const payload: CredentialPayload = {
        v: 1,
        event: 'XCERTZ_ISSUE',
        credentialId: crypto.randomUUID(),
        subjectWallet,
        certification: certification.trim(),
        issuerName: issuerName.trim(),
        issuerWallet: wallet,
        issuedAt: nowIso(),
        expiresAt: endOfDayIso(expiresAt),
      }
      const signature = await sendMemo(encodeIssueMemo(payload))
      const next = [{ signature, payload }, ...saved].slice(0, 20)
      setSaved(next)
      localStorage.setItem('xcertz-issued', JSON.stringify(next))
      setVerifySig(signature)
      setNotice('Credential issued and confirmed on Solana devnet.')
      await verifySignature(signature)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Credential issuance failed.')
    } finally {
      setBusy(null)
    }
  }

  const verifySignature = useCallback(async (signature: string) => {
    const cleanSignature = signature.trim()
    if (!cleanSignature) return
    setBusy('verify')
    setNotice('')
    setVerified(null)
    try {
      const { tx, payload, issuerVerified } = await extractCredential(connection, cleanSignature)
      const issuer = new PublicKey(payload.issuerWallet)
      const revoked = await checkRevoked(connection, issuer, cleanSignature, payload.credentialId)
      const expired = isExpiredAt(payload.expiresAt)
      setVerified({
        signature: cleanSignature,
        payload,
        issuerVerified,
        revoked,
        expired,
        blockTime: tx.blockTime,
      })
    } catch (error) {
      setVerified({
        signature: cleanSignature,
        issuerVerified: false,
        revoked: false,
        expired: false,
        error: error instanceof Error ? error.message : 'Verification failed.',
      })
    } finally {
      setBusy(null)
    }
  }, [])

  useEffect(() => {
    const initialSignature = new URLSearchParams(window.location.search).get('sig')
    if (initialSignature) void verifySignature(initialSignature)
  }, [verifySignature])

  async function revokeCredential(item: SavedCredential) {
    setBusy('revoke')
    setNotice('')
    try {
      if (!wallet || wallet !== item.payload.issuerWallet) {
        throw new Error('Connect the same issuer wallet that created this credential.')
      }
      const signature = await sendMemo(encodeRevokeMemo(item.payload.credentialId))
      setRevocationSignature(signature)
      setNotice(`Revocation confirmed: ${signature}`)
      if (verifySig === item.signature) await verifySignature(item.signature)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Revocation failed.')
    } finally {
      setBusy(null)
    }
  }

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    window.setTimeout(() => setCopied(''), 1400)
  }

  const verificationState = !verified
    ? 'idle'
    : verified.error || verified.revoked || verified.expired || !verified.issuerVerified
      ? 'invalid'
      : verified.payload
        ? 'valid'
        : 'idle'

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">xC</div>
          <div>
            <strong>xCertz</strong>
            <span>Portable proof for skilled trades</span>
          </div>
        </div>
        <div className="top-actions">
          <span className="network-pill"><span /> Solana Devnet</span>
          <button className="wallet-button" onClick={connectWallet} disabled={busy !== null}>
            {busy === 'connect' ? <Loader2 className="spin" size={16} /> : <Wallet size={16} />}
            {wallet ? short(wallet, 4) : 'Connect issuer'}
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><HardHat size={15} /> BUILT FOR THE PEOPLE WHO BUILD EVERYTHING ELSE</div>
          <h1>Tickets you can <em>prove.</em><br />Credentials you can carry.</h1>
          <p>
            xCertz anchors trade qualifications to Solana so a worker can carry a tamper-evident
            credential and an employer can verify it in seconds — without exposing personal data on-chain.
          </p>
          <div className="hero-badges">
            <span><ShieldCheck size={16} /> Issuer-signed</span>
            <span><ScanLine size={16} /> QR verifiable</span>
            <span><Ban size={16} /> Revocable</span>
            <span><Link2 size={16} /> Public audit trail</span>
          </div>
        </section>

        {notice && <div className="notice" role="status">{notice}</div>}
        {revocationSignature && <a className="explorer-link" href={`https://explorer.solana.com/tx/${revocationSignature}?cluster=devnet`} target="_blank" rel="noreferrer">View confirmed revocation <ExternalLink size={14} /></a>}

        <section className="grid">
          <div className="panel issue-panel">
            <div className="panel-heading">
              <div><span className="step">01</span><h2>Issue a credential</h2></div>
              <span className="muted">No PII goes on-chain</span>
            </div>
            <p className="privacy-note">Use public organization and qualification names only. Never enter a worker’s name, birth date, address, contact details, or personal ticket number. Memo contents are permanently public.</p>
            <div className="form-grid">
              <label>
                <span>Issuing organization (public name only)</span>
                <input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} />
              </label>
              <label>
                <span>Certification / ticket (no personal details)</span>
                <input value={certification} onChange={(e) => setCertification(e.target.value)} />
              </label>
              <label className="wide">
                <span>Worker credential address</span>
                <div className="input-action">
                  <input
                    value={subjectWallet}
                    onChange={(e) => setSubjectWallet(e.target.value)}
                    placeholder="Solana public key"
                  />
                  <button
                    type="button"
                    className="mini-button"
                    onClick={() => setSubjectWallet(Keypair.generate().publicKey.toBase58())}
                  >
                    Demo address
                  </button>
                </div>
              </label>
              <label>
                <span>Expires</span>
                <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </label>
              <div className="issue-action">
                <button className="primary" onClick={issueCredential} disabled={busy !== null}>
                  {busy === 'issue' ? <Loader2 className="spin" size={18} /> : <Award size={18} />}
                  Issue on Solana
                </button>
              </div>
            </div>
          </div>

          <div className="panel verify-panel">
            <div className="panel-heading">
              <div><span className="step">02</span><h2>Verify instantly</h2></div>
            </div>
            <div className="verify-input">
              <input
                value={verifySig}
                onChange={(e) => setVerifySig(e.target.value)}
                placeholder="Paste an xCertz transaction signature"
              />
              <button aria-label="Verify credential" onClick={() => void verifySignature(verifySig)} disabled={busy !== null}>
                {busy === 'verify' ? <Loader2 className="spin" size={18} /> : <ScanLine size={18} />}
              </button>
            </div>

            <div className={`verification-card ${verificationState}`}>
              {verificationState === 'idle' && (
                <div className="empty-state">
                  <ShieldCheck size={34} />
                  <strong>Waiting for proof</strong>
                  <span>Paste a signature or scan an xCertz QR code.</span>
                </div>
              )}
              {verified?.error && (
                <div className="empty-state bad">
                  <Ban size={34} />
                  <strong>Not verified</strong>
                  <span>{verified.error}</span>
                </div>
              )}
              {verified?.payload && (
                <>
                  <div className="verification-status">
                    {verificationState === 'valid' ? <ShieldCheck size={24} /> : <Ban size={24} />}
                    <div>
                      <strong>{verificationState === 'valid' ? 'VALID CREDENTIAL' : 'CREDENTIAL NOT VALID'}</strong>
                      <span>{verified.revoked ? 'Revoked by issuer' : verified.expired ? 'Expired' : verified.issuerVerified ? 'Issuer signature confirmed' : 'Issuer mismatch'}</span>
                    </div>
                  </div>
                  <div className="credential-facts">
                    <div><span>Qualification</span><strong>{verified.payload.certification}</strong></div>
                    <div><span>Issuer</span><strong>{verified.payload.issuerName}</strong></div>
                    <div><span>Worker address</span><strong>{short(verified.payload.subjectWallet, 7)}</strong></div>
                    <div><span>Expires</span><strong>{formatDate(verified.payload.expiresAt)}</strong></div>
                  </div>
                  <a
                    className="explorer-link"
                    href={`https://explorer.solana.com/tx/${verified.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View immutable proof <ExternalLink size={14} />
                  </a>
                </>
              )}
            </div>
          </div>
        </section>

        {latest && (
          <section className="credential-section">
            <div className="section-title">
              <div><span className="step">03</span><h2>Carry the proof</h2></div>
              <span>Worker-facing credential</span>
            </div>
            <div className="credential-card">
              <div className="credential-main">
                <div className="credential-brand"><ShieldCheck size={23} /> xCertz CREDENTIAL</div>
                <h3>{latest.payload.certification}</h3>
                <p>Issued by {latest.payload.issuerName}</p>
                <div className="credential-meta">
                  <span><Building2 size={15} /> {short(latest.payload.issuerWallet, 6)}</span>
                  <span><Clock3 size={15} /> Expires {formatDate(latest.payload.expiresAt)}</span>
                </div>
                <div className="credential-id">
                  <span>ID {latest.payload.credentialId}</span>
                  <button onClick={() => copy(latest.signature, 'sig')}>
                    {copied === 'sig' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="qr-wrap">
                <QRCodeSVG value={verifyUrl} size={132} bgColor="transparent" fgColor="currentColor" />
                <span>Scan to verify</span>
                <button className="mini-button" onClick={() => copy(verifyUrl, 'url')}>{copied === 'url' ? 'Copied' : 'Copy share link'}</button>
              </div>
            </div>

            <div className="recent-list">
              {saved.slice(0, 5).map((item) => (
                <div className="recent-row" key={item.signature}>
                  <div>
                    <strong>{item.payload.certification}</strong>
                    <span>{item.payload.issuerName} · {formatDate(item.payload.expiresAt)}</span>
                  </div>
                  <div className="row-actions">
                    <button onClick={() => { setVerifySig(item.signature); void verifySignature(item.signature) }}>
                      <RefreshCw size={14} /> Verify
                    </button>
                    <button className="danger-ghost" onClick={() => void revokeCredential(item)} disabled={busy !== null || wallet !== item.payload.issuerWallet}>
                      <Ban size={14} /> Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="why">
          <div>
            <span className="step">WHY</span>
            <h2>Credentials are still being verified like it’s 1998.</h2>
          </div>
          <div className="why-grid">
            <article>
              <strong>For workers</strong>
              <p>Carry qualifications between contractors instead of resending PDFs, screenshots, and paper tickets.</p>
            </article>
            <article>
              <strong>For employers</strong>
              <p>Verify who issued a ticket, whether it is current, and whether it was revoked before someone starts work.</p>
            </article>
            <article>
              <strong>For issuers</strong>
              <p>Issue once, revoke when needed, and leave a tamper-evident audit trail without publishing personal records.</p>
            </article>
          </div>
        </section>
      </main>

      <footer>
        <span>xCertz · Crypto World’s Fair 2026</span>
        <span>Solana devnet prototype · No production credentials</span>
      </footer>
    </div>
  )
}

export default App
