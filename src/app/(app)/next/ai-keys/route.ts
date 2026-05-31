import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'
import {
  getKeyStatus,
  getPersonalKeyStatus,
  getGlobalKeyStatus,
  resolveApiKey,
} from '@/lib/ai-key-encryption'

const VALID_PROVIDERS = ['anthropic', 'bfl', 'gemini', 'openai']

/**
 * GET /next/ai-keys?scope=personal|global
 *
 * scope=personal → personal key status for current user
 * scope=global   → global key status (owner/admin only)
 * no scope       → combined status (legacy)
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const url = new URL(req.url)
    const scope = url.searchParams.get('scope')

    if (scope === 'global') {
      if (!isOwnerOrAdmin(user)) {
        return Response.json({ error: 'Access denied' }, { status: 403 })
      }
      const status = await getGlobalKeyStatus(payload)
      return Response.json({ providers: status })
    }

    if (scope === 'personal') {
      const status = await getPersonalKeyStatus(user.id, payload)
      return Response.json({ providers: status })
    }

    // Legacy: combined status
    const status = await getKeyStatus(user.id, payload)
    return Response.json({ providers: status, userId: user.id })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /next/ai-keys
 *
 * Validate a specific API key against its provider.
 * Body: { provider, action: 'validate' | 'validate-all' }
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { provider, action } = await req.json()

    if (action === 'validate') {
      return validateKey(provider, user.id, payload)
    }

    if (action === 'validate-all') {
      return validateAllKeys(user.id, payload)
    }

    return Response.json({ error: 'Unknown action. Use "validate" or "validate-all".' }, { status: 400 })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /next/ai-keys
 *
 * Set or remove an API key.
 * Body: { scope: 'personal' | 'global', provider, action: 'set' | 'remove', key?, keyLabel? }
 */
export async function PATCH(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { scope, provider, action, key, keyLabel } = await req.json()

    if (!VALID_PROVIDERS.includes(provider)) {
      return Response.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
    }

    if (scope === 'global') {
      if (!isOwnerOrAdmin(user)) {
        return Response.json({ error: 'Access denied. Only owners and admins can manage global keys.' }, { status: 403 })
      }
      return handleGlobalKey(provider, action, key, keyLabel, payload)
    }

    // Default: personal scope
    return handlePersonalKey(user.id, provider, action, key, keyLabel, payload)
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function handlePersonalKey(
  userId: string,
  provider: string,
  action: string,
  key: string | undefined,
  keyLabel: string | undefined,
  payload: any,
): Promise<Response> {
  const keyField = `${provider}Key`
  const labelField = `${provider}KeyLabel`

  const currentUser = await payload.findByID({
    collection: 'team',
    id: userId,
    depth: 0,
    context: { skipMask: true },
  })
  const existingKeys = currentUser?.aiKeys || {}

  if (action === 'set') {
    if (!key) {
      return Response.json({ error: 'Key is required for set action' }, { status: 400 })
    }
    await payload.update({
      collection: 'team',
      id: userId,
      data: {
        aiKeys: {
          ...existingKeys,
          [keyField]: key,
          [labelField]: keyLabel || '',
        },
      } as any,
      depth: 0,
    })
  } else if (action === 'remove') {
    await payload.update({
      collection: 'team',
      id: userId,
      data: {
        aiKeys: {
          ...existingKeys,
          [keyField]: '',
          [labelField]: '',
        },
      } as any,
      depth: 0,
    })
  } else {
    return Response.json({ error: 'Unknown action. Use "set" or "remove".' }, { status: 400 })
  }

  const status = await getPersonalKeyStatus(userId, payload)
  return Response.json({ providers: status })
}

async function handleGlobalKey(
  provider: string,
  action: string,
  key: string | undefined,
  keyLabel: string | undefined,
  payload: any,
): Promise<Response> {
  const keyField = `${provider}Key`
  const labelField = `${provider}KeyLabel`

  if (action === 'set') {
    if (!key) {
      return Response.json({ error: 'Key is required for set action' }, { status: 400 })
    }
    await payload.updateGlobal({
      slug: 'ai-settings',
      data: {
        [keyField]: key,
        [labelField]: keyLabel || '',
      },
      depth: 0,
    })
  } else if (action === 'remove') {
    await payload.updateGlobal({
      slug: 'ai-settings',
      data: {
        [keyField]: '',
        [labelField]: '',
      },
      depth: 0,
    })
  } else {
    return Response.json({ error: 'Unknown action. Use "set" or "remove".' }, { status: 400 })
  }

  const status = await getGlobalKeyStatus(payload)
  return Response.json({ providers: status })
}

async function validateKey(
  provider: string,
  userId: string,
  payload: any,
): Promise<Response> {
  const key = await resolveApiKey(provider as any, userId, payload)

  if (!key) {
    return Response.json({
      provider,
      valid: false,
      error: 'No key configured',
    })
  }

  try {
    let valid = false
    let model = ''

    switch (provider) {
      case 'anthropic': {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }],
          }),
        })
        valid = res.status === 200 || res.status === 429
        model = 'claude-haiku-4-5'
        break
      }

      case 'bfl': {
        const res = await fetch('https://api.bfl.ai/v1/get_result?id=test', {
          headers: { 'X-Key': key },
        })
        valid = res.status !== 401 && res.status !== 403
        model = 'flux-2-pro'
        break
      }

      case 'gemini': {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
        )
        valid = res.status === 200
        model = 'gemini-2.5-flash'
        break
      }

      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        })
        valid = res.status === 200
        model = 'gpt-image-1'
        break
      }

      default:
        return Response.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
    }

    return Response.json({ provider, valid, model })
  } catch (error: any) {
    return Response.json({
      provider,
      valid: false,
      error: error.message,
    })
  }
}

async function validateAllKeys(userId: string, payload: any): Promise<Response> {
  const providers = ['anthropic', 'bfl', 'gemini', 'openai']
  const results: Record<string, any> = {}

  for (const provider of providers) {
    const res = await validateKey(provider, userId, payload)
    const json = await res.json()
    results[provider] = json
  }

  return Response.json({ results })
}
