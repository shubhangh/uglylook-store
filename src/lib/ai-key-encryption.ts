/**
 * AES-256-GCM encryption for AI API keys.
 *
 * Keys are encrypted before storage in MongoDB.
 * Encryption key derived from PAYLOAD_SECRET via scrypt.
 * No additional env vars needed.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto'
import type { Payload } from 'payload'

const ALGORITHM = 'aes-256-gcm'
const SALT = 'uglylook-ai-keys-v1'
const PREFIX = 'enc:'

function getEncryptionKey(): Buffer {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set — cannot encrypt keys')
  return scryptSync(secret, SALT, 32)
}

export function encrypt(plaintext: string): string {
  if (!plaintext || plaintext.startsWith(PREFIX)) return plaintext // already encrypted or empty
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext || !ciphertext.startsWith(PREFIX)) return ciphertext
  const parts = ciphertext.slice(PREFIX.length).split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted value format')
  const [ivHex, encHex, tagHex] = parts
  const key = getEncryptionKey()
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, 'hex'),
  )
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return (
    decipher.update(Buffer.from(encHex, 'hex'), undefined, 'utf8') +
    decipher.final('utf8')
  )
}

export function isEncrypted(value: string): boolean {
  return value?.startsWith(PREFIX) || false
}

export function mask(value: string): string {
  if (!value) return ''
  // Decrypt first if encrypted, then mask
  let plain = value
  try {
    if (isEncrypted(value)) {
      plain = decrypt(value)
    }
  } catch {
    return '••••••••(invalid)'
  }
  if (plain.length <= 8) return '••••••••'
  return '••••••••' + plain.slice(-8)
}

/**
 * Resolve the API key for a provider.
 * Priority: user personal key → global AI Settings → env var fallback.
 */
export async function resolveApiKey(
  provider: 'anthropic' | 'bfl' | 'gemini' | 'openai',
  userId: string | null,
  payload: Payload,
): Promise<string | null> {
  const keyField = `${provider}Key`

  // 1. Check user's personal key (skipMask bypasses the afterRead masking hook)
  if (userId) {
    try {
      const user = await payload.findByID({
        collection: 'team',
        id: userId,
        depth: 0,
        overrideAccess: true,
        context: { skipMask: true },
      } as any)
      const personalKey = (user as any)?.aiKeys?.[keyField]
      if (personalKey && isEncrypted(personalKey)) {
        return decrypt(personalKey)
      }
    } catch {
      // User not found or no key
    }
  }

  // 2. Check global AI Settings (skipMask bypasses the afterRead masking hook)
  try {
    const settings = await payload.findGlobal({
      slug: 'ai-settings' as any,
      depth: 0,
      overrideAccess: true,
      context: { skipMask: true },
    } as any)
    const globalKey = (settings as any)?.[keyField]
    if (globalKey && isEncrypted(globalKey)) {
      return decrypt(globalKey)
    }
    // Handle non-encrypted keys (e.g., just stored as plain text initially)
    if (globalKey && !isEncrypted(globalKey) && globalKey.length > 10) {
      return globalKey
    }
  } catch {
    // Global not found or no key
  }

  // 3. Fallback to env var
  const envMap: Record<string, string> = {
    anthropic: 'ANTHROPIC_API_KEY',
    bfl: 'BFL_API_KEY',
    gemini: 'GOOGLE_AI_API_KEY',
    openai: 'OPENAI_API_KEY',
  }
  return process.env[envMap[provider]] || null
}

/**
 * Check which providers have keys configured (combined view).
 */
export type KeyStatusEntry = {
  configured: boolean
  source: 'personal' | 'global' | 'env' | 'none'
  maskedKey: string
  label: string
}

const ENV_MAP: Record<string, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  bfl: 'BFL_API_KEY',
  gemini: 'GOOGLE_AI_API_KEY',
  openai: 'OPENAI_API_KEY',
}

const PROVIDERS = ['anthropic', 'bfl', 'gemini', 'openai'] as const

export async function getKeyStatus(
  userId: string | null,
  payload: Payload,
): Promise<Record<string, KeyStatusEntry>> {
  const result: Record<string, KeyStatusEntry> = {}

  let userData: any = null
  let globalData: any = null

  if (userId) {
    try {
      userData = await payload.findByID({ collection: 'team', id: userId, depth: 0, overrideAccess: true, context: { skipMask: true } } as any)
    } catch { /* */ }
  }
  try {
    globalData = await payload.findGlobal({ slug: 'ai-settings' as any, depth: 0, overrideAccess: true, context: { skipMask: true } } as any)
  } catch { /* */ }

  for (const provider of PROVIDERS) {
    const keyField = `${provider}Key`
    const labelField = `${provider}KeyLabel`
    let source: 'personal' | 'global' | 'env' | 'none' = 'none'
    let maskedKey = ''
    let label = ''

    const pk = userData?.aiKeys?.[keyField]
    if (pk && (isEncrypted(pk) || pk.length > 10)) {
      source = 'personal'
      maskedKey = mask(pk)
      label = userData?.aiKeys?.[labelField] || ''
    }

    if (source === 'none') {
      const gk = globalData?.[keyField]
      if (gk && (isEncrypted(gk) || gk.length > 10)) {
        source = 'global'
        maskedKey = mask(gk)
        label = globalData?.[labelField] || ''
      }
    }

    if (source === 'none') {
      const envVal = process.env[ENV_MAP[provider]]
      if (envVal) {
        source = 'env'
        maskedKey = mask(envVal)
        label = ''
      }
    }

    result[provider] = { configured: source !== 'none', source, maskedKey, label }
  }

  return result
}

/**
 * Personal key status — shows whether user has a personal key,
 * plus what the effective fallback source is.
 */
export type PersonalKeyStatusEntry = {
  hasPersonalKey: boolean
  maskedKey: string
  label: string
  effectiveSource: 'personal' | 'global' | 'env' | 'none'
}

export async function getPersonalKeyStatus(
  userId: string,
  payload: Payload,
): Promise<Record<string, PersonalKeyStatusEntry>> {
  const result: Record<string, PersonalKeyStatusEntry> = {}

  let userData: any = null
  let globalData: any = null

  try {
    userData = await payload.findByID({ collection: 'team', id: userId, depth: 0, overrideAccess: true, context: { skipMask: true } } as any)
  } catch { /* */ }
  try {
    globalData = await payload.findGlobal({ slug: 'ai-settings' as any, depth: 0, overrideAccess: true, context: { skipMask: true } } as any)
  } catch { /* */ }

  for (const provider of PROVIDERS) {
    const keyField = `${provider}Key`
    const labelField = `${provider}KeyLabel`

    const pk = userData?.aiKeys?.[keyField]
    const hasPersonalKey = !!(pk && (isEncrypted(pk) || pk.length > 10))

    let effectiveSource: 'personal' | 'global' | 'env' | 'none' = 'none'
    if (hasPersonalKey) {
      effectiveSource = 'personal'
    } else {
      const gk = globalData?.[keyField]
      if (gk && (isEncrypted(gk) || gk.length > 10)) {
        effectiveSource = 'global'
      } else if (process.env[ENV_MAP[provider]]) {
        effectiveSource = 'env'
      }
    }

    result[provider] = {
      hasPersonalKey,
      maskedKey: hasPersonalKey ? mask(pk) : '',
      label: hasPersonalKey ? (userData?.aiKeys?.[labelField] || '') : '',
      effectiveSource,
    }
  }

  return result
}

/**
 * Global key status — shows whether a global key is set in AISettings,
 * plus whether an env var fallback exists.
 */
export type GlobalKeyStatusEntry = {
  hasGlobalKey: boolean
  hasEnvKey: boolean
  maskedKey: string
  label: string
}

export async function getGlobalKeyStatus(
  payload: Payload,
): Promise<Record<string, GlobalKeyStatusEntry>> {
  const result: Record<string, GlobalKeyStatusEntry> = {}

  let globalData: any = null
  try {
    globalData = await payload.findGlobal({ slug: 'ai-settings' as any, depth: 0, overrideAccess: true, context: { skipMask: true } } as any)
  } catch { /* */ }

  for (const provider of PROVIDERS) {
    const keyField = `${provider}Key`
    const labelField = `${provider}KeyLabel`

    const gk = globalData?.[keyField]
    const hasGlobalKey = !!(gk && (isEncrypted(gk) || gk.length > 10))
    const hasEnvKey = !!process.env[ENV_MAP[provider]]

    result[provider] = {
      hasGlobalKey,
      hasEnvKey,
      maskedKey: hasGlobalKey ? mask(gk) : (hasEnvKey ? mask(process.env[ENV_MAP[provider]]!) : ''),
      label: hasGlobalKey ? (globalData?.[labelField] || '') : '',
    }
  }

  return result
}
