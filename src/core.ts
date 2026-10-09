export type CredentialPayload = {
  v: 1
  event: 'XCERTZ_ISSUE'
  credentialId: string
  subjectWallet: string
  certification: string
  issuerName: string
  issuerWallet: string
  issuedAt: string
  expiresAt: string
}

export const ISSUE_PREFIX = 'xcertz:'
export const REVOKE_PREFIX = 'xcertz-revoke:'

export function encodeIssueMemo(payload: CredentialPayload) {
  return ISSUE_PREFIX + JSON.stringify(payload)
}

export function decodeIssueMemo(memo: string): CredentialPayload {
  if (!memo.startsWith(ISSUE_PREFIX)) {
    throw new Error('This transaction does not contain an xCertz credential.')
  }
  const payload = JSON.parse(memo.slice(ISSUE_PREFIX.length)) as Partial<CredentialPayload>
  if (
    payload.v !== 1 ||
    payload.event !== 'XCERTZ_ISSUE' ||
    typeof payload.credentialId !== 'string' || !payload.credentialId.trim() ||
    typeof payload.subjectWallet !== 'string' || !payload.subjectWallet.trim() ||
    typeof payload.certification !== 'string' || !payload.certification.trim() ||
    typeof payload.issuerName !== 'string' || !payload.issuerName.trim() ||
    typeof payload.issuerWallet !== 'string' || !payload.issuerWallet.trim() ||
    typeof payload.issuedAt !== 'string' || !Number.isFinite(Date.parse(payload.issuedAt)) ||
    typeof payload.expiresAt !== 'string' || !Number.isFinite(Date.parse(payload.expiresAt)) ||
    Date.parse(payload.expiresAt) <= Date.parse(payload.issuedAt)
  ) {
    throw new Error('Unsupported xCertz credential format.')
  }
  return payload as CredentialPayload
}

export function encodeRevokeMemo(credentialId: string) {
  return REVOKE_PREFIX + credentialId
}

export function hasRevocationMemo(
  memos: Array<string | null | undefined>,
  credentialId: string,
) {
  const expected = encodeRevokeMemo(credentialId)
  return memos.some((memo) => memo === expected)
}

export function isExpiredAt(expiresAt: string, nowMs = Date.now()) {
  const expiry = Date.parse(expiresAt)
  return !Number.isFinite(expiry) || nowMs >= expiry
}
