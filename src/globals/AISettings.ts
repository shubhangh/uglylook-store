import type { GlobalConfig, FieldHook } from 'payload'
import { isAdmin } from '@/access/isAdmin'
import { encrypt, isEncrypted, mask } from '@/lib/ai-key-encryption'

/**
 * Encrypt key before saving to DB.
 * Skips if already encrypted or empty.
 */
const encryptOnSave: FieldHook = ({ value, previousValue }) => {
  if (!value) return value
  // If already encrypted, don't re-encrypt
  if (isEncrypted(value)) return value
  // If it looks like a masked value, keep previous (which may also be masked —
  // the global-level beforeChange hook below will fix it)
  if (value.startsWith('••')) return previousValue
  // New plaintext key — encrypt it
  return encrypt(value)
}

/**
 * Mask key when reading from DB for API/admin display.
 * Never expose the full key.
 * Skipped when context.skipMask is set (used by resolveApiKey to get raw encrypted value).
 */
const maskOnRead: FieldHook = ({ value, context }) => {
  if (!value) return value
  if (context?.skipMask) return value
  return mask(value)
}

export const AISettings: GlobalConfig = {
  slug: 'ai-settings',
  label: 'AI Settings',
  admin: {
    group: 'Printify',
    description: 'API keys for AI services (encrypted in database). Model preferences and cost tracking.',
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Protect encrypted keys from being overwritten by masked values.
        // When the admin form saves, afterRead has already masked the keys.
        // If a key field contains a masked value (••), restore the raw encrypted
        // value from the database so it doesn't get corrupted.
        const keyFields = ['anthropicKey', 'bflKey', 'geminiKey', 'openaiKey']
        const hasMaskedKeys = keyFields.some(
          (f) => data[f] && typeof data[f] === 'string' && data[f].startsWith('••'),
        )

        if (hasMaskedKeys) {
          try {
            const raw = await req.payload.findGlobal({
              slug: 'ai-settings' as any,
              depth: 0,
              overrideAccess: true,
              context: { skipMask: true },
            } as any)

            for (const f of keyFields) {
              if (data[f] && typeof data[f] === 'string' && data[f].startsWith('••')) {
                // Restore the raw encrypted value from DB
                data[f] = (raw as any)?.[f] || ''
              }
            }
          } catch {
            // If we can't read raw values, clear masked fields to prevent corruption
            for (const f of keyFields) {
              if (data[f] && typeof data[f] === 'string' && data[f].startsWith('••')) {
                delete data[f]
              }
            }
          }
        }

        return data
      },
    ],
  },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    // ── Global API Keys ──
    {
      type: 'collapsible',
      label: 'API Keys (Encrypted)',
      admin: {
        description: 'Keys are encrypted with AES-256-GCM before storage. Only masked values are shown.',
      },
      fields: [
        {
          name: 'anthropicKeyLabel',
          type: 'text',
          label: 'Anthropic Key Label',
          maxLength: 30,
          admin: { placeholder: 'e.g., Production, Dev, Personal', width: '50%' },
        },
        {
          name: 'anthropicKey',
          type: 'text',
          label: 'Anthropic API Key (Claude)',
          admin: {
            description: 'For prompt engineering. Get from console.anthropic.com/settings/keys',
          },
          hooks: {
            beforeChange: [encryptOnSave],
            afterRead: [maskOnRead],
          },
        },
        {
          name: 'bflKeyLabel',
          type: 'text',
          label: 'BFL Key Label',
          maxLength: 30,
          admin: { placeholder: 'e.g., Production, Dev, Personal', width: '50%' },
        },
        {
          name: 'bflKey',
          type: 'text',
          label: 'BFL API Key (FLUX)',
          admin: {
            description: 'For FLUX image generation. Get from api.bfl.ai',
          },
          hooks: {
            beforeChange: [encryptOnSave],
            afterRead: [maskOnRead],
          },
        },
        {
          name: 'geminiKeyLabel',
          type: 'text',
          label: 'Gemini Key Label',
          maxLength: 30,
          admin: { placeholder: 'e.g., Production, Dev, Personal', width: '50%' },
        },
        {
          name: 'geminiKey',
          type: 'text',
          label: 'Google Gemini API Key',
          admin: {
            description: 'For Gemini Flash image generation. Get from aistudio.google.com/apikey',
          },
          hooks: {
            beforeChange: [encryptOnSave],
            afterRead: [maskOnRead],
          },
        },
        {
          name: 'openaiKeyLabel',
          type: 'text',
          label: 'OpenAI Key Label',
          maxLength: 30,
          admin: { placeholder: 'e.g., Production, Dev, Personal', width: '50%' },
        },
        {
          name: 'openaiKey',
          type: 'text',
          label: 'OpenAI API Key (GPT Image)',
          admin: {
            description: 'Optional — for GPT Image creative designs. Get from platform.openai.com/api-keys',
          },
          hooks: {
            beforeChange: [encryptOnSave],
            afterRead: [maskOnRead],
          },
        },
      ],
    },

    // ── Model Preferences ──
    {
      type: 'collapsible',
      label: 'Default Model Preferences',
      fields: [
        {
          name: 'defaultPromptModel',
          type: 'relationship',
          relationTo: 'ai-model-registry',
          label: 'Default Prompt Model',
          admin: {
            description: 'Default Claude model for prompt engineering. Can be overridden per generation.',
          },
        },
        {
          name: 'defaultImageModel',
          type: 'relationship',
          relationTo: 'ai-model-registry',
          label: 'Default Image Model',
          admin: {
            description: 'Default image generation model. Can be overridden per generation.',
          },
        },
        {
          name: 'defaultDetailLevel',
          type: 'select',
          label: 'Default Prompt Detail Level',
          defaultValue: 'medium',
          options: [
            { label: 'Low (~100 words)', value: 'low' },
            { label: 'Medium (~200 words)', value: 'medium' },
            { label: 'High (~350 words)', value: 'high' },
            { label: 'Very High (~500 words)', value: 'very-high' },
          ],
        },
        {
          name: 'defaultBatchCount',
          type: 'number',
          label: 'Default Batch Count',
          defaultValue: 4,
          min: 1,
          max: 10,
        },
      ],
    },

    // ── Cost Tracking ──
    {
      type: 'collapsible',
      label: 'Cost Tracking',
      fields: [
        {
          name: 'totalSpent',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Total USD spent on AI generation (all users, all time)',
          },
        },
        {
          name: 'monthlySpent',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'USD spent this month (resets monthly)',
          },
        },
        {
          name: 'monthlyBudget',
          type: 'number',
          defaultValue: 50,
          label: 'Monthly Budget (USD)',
          admin: {
            description: 'Warning shown when monthly spend approaches this amount. 0 = no limit.',
          },
        },
        {
          name: 'lastResetMonth',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'YYYY-MM of last monthly reset',
          },
        },
      ],
    },
  ],
}
