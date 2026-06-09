import type { CollectionConfig, FieldHook } from 'payload'
import { encrypt, isEncrypted, mask } from '@/lib/ai-key-encryption'

const isOwnerOrAdmin = (user: any): boolean =>
  !!user?.role && ['owner', 'admin'].includes(user.role)

export const Team: CollectionConfig = {
  slug: 'team',
  labels: {
    singular: 'Team Member',
    plural: 'Team',
  },
  admin: {
    group: 'Team',
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 1209600, // 14 days
  },
  access: {
    admin: ({ req: { user } }) => {
      const u = user as any
      return !!u?.role && ['owner', 'admin', 'manager', 'editor'].includes(u.role)
    },
    create: ({ req: { user } }) => isOwnerOrAdmin(user),
    read: ({ req: { user } }) => {
      const u = user as any
      if (!u?.role) return false
      // Owner/admin can see all team members
      if (isOwnerOrAdmin(u)) return true
      // Manager/editor can see themselves + other managers and editors (not owner/admin)
      return {
        role: { in: ['manager', 'editor'] },
      }
    },
    update: ({ req: { user } }) => {
      const u = user as any
      if (!u?.role) return false
      if (isOwnerOrAdmin(u)) return true
      // Manager/editor can only update themselves
      return { id: { equals: u.id } }
    },
    delete: ({ req: { user } }) => (user as any)?.role === 'owner',
    unlock: ({ req: { user } }) => isOwnerOrAdmin(user),
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        // Protect encrypted personal keys from masked-value corruption.
        const keyFields = ['anthropicKey', 'bflKey', 'geminiKey', 'openaiKey']
        if (!data.aiKeys) return data

        const hasMaskedKeys = keyFields.some(
          (f) => data.aiKeys?.[f] && typeof data.aiKeys[f] === 'string' && data.aiKeys[f].startsWith('••'),
        )

        if (hasMaskedKeys && originalDoc?.id) {
          try {
            const raw = await req.payload.findByID({
              collection: 'team',
              id: originalDoc.id,
              depth: 0,
              overrideAccess: true,
              context: { skipMask: true },
            } as any)

            for (const f of keyFields) {
              if (data.aiKeys[f] && typeof data.aiKeys[f] === 'string' && data.aiKeys[f].startsWith('••')) {
                data.aiKeys[f] = (raw as any)?.aiKeys?.[f] || ''
              }
            }
          } catch {
            for (const f of keyFields) {
              if (data.aiKeys?.[f]?.startsWith('••')) {
                delete data.aiKeys[f]
              }
            }
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile picture',
      },
    },
    {
      name: 'email',
      // Payload auto-creates the email field for auth collections,
      // but we re-declare it here to add field-level access control.
      // Only owner/admin can change email. Manager/editor see it read-only.
      type: 'email',
      access: {
        update: ({ req: { user } }) => isOwnerOrAdmin(user),
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Owner', value: 'owner' },
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'Editor', value: 'editor' },
      ],
      access: {
        read: () => true,
        // Role change access rules:
        // - Nobody can change their own role (prevents self-escalation and accidental self-demotion)
        // - Owner can change anyone else's role
        // - Admin can only change manager/editor roles (not other admins or owners)
        // - Manager/editor cannot change roles at all
        update: ({ req: { user }, doc }) => {
          const u = user as any
          if (!u?.role) return false

          // Block self-role-change for everyone (including owner)
          if (u.id === doc?.id) return false

          // Owner can change anyone else's role
          if (u.role === 'owner') return true

          // Admin can only change manager/editor roles (not admin/owner)
          if (u.role === 'admin') {
            const targetRole = (doc as any)?.role
            return targetRole === 'manager' || targetRole === 'editor'
          }

          return false
        },
      },
      admin: {
        description: 'Owner: full control. Admin: full CRUD. Manager: products + orders. Editor: content only. You cannot change your own role.',
      },
      hooks: {
        beforeChange: [
          async ({ operation, req, value, previousValue, siblingData }) => {
            const u = req.user as any

            // First user is always owner
            if (operation === 'create') {
              const team = await req.payload.find({
                collection: 'team',
                depth: 0,
                limit: 0,
              })
              if (team.totalDocs === 0) {
                return 'owner'
              }
            }

            // Double-check: block self-role-change at hook level too (belt + suspenders)
            const targetId = siblingData?.id || (req as any).params?.id
            if (targetId && u?.id === targetId) {
              return previousValue || value
            }

            // Only owner can assign 'owner' or 'admin' roles
            if ((value === 'owner' || value === 'admin') && u?.role !== 'owner') {
              return previousValue || 'editor'
            }

            // Admin can only change manager/editor targets
            if (u?.role === 'admin' && previousValue && !['manager', 'editor'].includes(previousValue)) {
              return previousValue
            }

            return value
          },
        ],
      },
    },
    // ── Personal AI API Keys (encrypted) ──
    {
      name: 'aiKeys',
      type: 'group',
      label: 'Personal AI API Keys',
      admin: {
        description: 'Optional — your personal keys override global keys for your AI generation usage.',
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
          label: 'Anthropic Key (Claude)',
          admin: { description: 'Overrides global Anthropic key for your usage' },
          hooks: {
            beforeChange: [
              (({ value, previousValue }) => {
                if (!value) return value
                if (value === previousValue) return previousValue
                if (isEncrypted(value)) return value
                if (value.startsWith('••')) return previousValue
                return encrypt(value)
              }) as FieldHook,
            ],
            afterRead: [
              (({ value, context }) => {
                if (!value || context?.skipMask) return value
                return mask(value)
              }) as FieldHook,
            ],
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
          label: 'BFL Key (FLUX)',
          admin: { description: 'Overrides global BFL key for your usage' },
          hooks: {
            beforeChange: [
              (({ value, previousValue }) => {
                if (!value) return value
                if (value === previousValue) return previousValue
                if (isEncrypted(value)) return value
                if (value.startsWith('••')) return previousValue
                return encrypt(value)
              }) as FieldHook,
            ],
            afterRead: [
              (({ value, context }) => {
                if (!value || context?.skipMask) return value
                return mask(value)
              }) as FieldHook,
            ],
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
          label: 'Gemini Key (Google)',
          admin: { description: 'Overrides global Gemini key for your usage' },
          hooks: {
            beforeChange: [
              (({ value, previousValue }) => {
                if (!value) return value
                if (value === previousValue) return previousValue
                if (isEncrypted(value)) return value
                if (value.startsWith('••')) return previousValue
                return encrypt(value)
              }) as FieldHook,
            ],
            afterRead: [
              (({ value, context }) => {
                if (!value || context?.skipMask) return value
                return mask(value)
              }) as FieldHook,
            ],
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
          label: 'OpenAI Key',
          admin: { description: 'Overrides global OpenAI key for your usage' },
          hooks: {
            beforeChange: [
              (({ value, previousValue }) => {
                if (!value) return value
                if (value === previousValue) return previousValue
                if (isEncrypted(value)) return value
                if (value.startsWith('••')) return previousValue
                return encrypt(value)
              }) as FieldHook,
            ],
            afterRead: [
              (({ value, context }) => {
                if (!value || context?.skipMask) return value
                return mask(value)
              }) as FieldHook,
            ],
          },
        },
      ],
    },
  ],
}
