import { describe, expect, it } from 'vitest'
import {
  decodeIssueMemo,
  encodeIssueMemo,
  encodeRevokeMemo,
  hasRevocationMemo,
  isExpiredAt,
  type CredentialPayload,
} from './core'

const fixture: CredentialPayload = {
  v: 1,
  event: 'XCERTZ_ISSUE',
  credentialId: 'cred-123',
  subjectWallet: 'Worker111111111111111111111111111111111111',
  certification: 'Red Seal Welder',
  issuerName: 'Pacific Trades Academy',
  issuerWallet: 'Issuer111111111111111111111111111111111111',
  issuedAt: '2026-10-05T09:00:00.000Z',
  expiresAt: '2028-10-05T23:59:59.000Z',
}

describe('xCertz protocol core', () => {
  it('round-trips an issued credential memo', () => {
    expect(decodeIssueMemo(encodeIssueMemo(fixture))).toEqual(fixture)
  })

  it('rejects non-xCertz and incomplete memos', () => {
    expect(() => decodeIssueMemo('hello')).toThrow(/does not contain/)
    expect(() => decodeIssueMemo('xcertz:{"v":1}')).toThrow(/Unsupported/)
    for (const change of [{expiresAt: 'invalid'}, {issuerName: 42}, {expiresAt: fixture.issuedAt}]) {
      expect(() => decodeIssueMemo('xcertz:' + JSON.stringify({...fixture, ...change}))).toThrow(/Unsupported/)
    }
  })

  it('encodes and detects issuer revocation', () => {
    const revocation = encodeRevokeMemo(fixture.credentialId)
    expect(revocation).toBe('xcertz-revoke:cred-123')
    expect(hasRevocationMemo([null, 'other', revocation], fixture.credentialId)).toBe(true)
    expect(hasRevocationMemo(['xcertz-revoke:different'], fixture.credentialId)).toBe(false)
    expect(hasRevocationMemo([revocation + '-different', 'text ' + revocation], fixture.credentialId)).toBe(false)
  })

  it('evaluates expiry against a deterministic clock', () => {
    expect(isExpiredAt(fixture.expiresAt, Date.parse('2027-01-01T00:00:00Z'))).toBe(false)
    expect(isExpiredAt(fixture.expiresAt, Date.parse('2029-01-01T00:00:00Z'))).toBe(true)
    expect(isExpiredAt(fixture.expiresAt, Date.parse(fixture.expiresAt))).toBe(true)
    expect(isExpiredAt('invalid')).toBe(true)
  })
})
