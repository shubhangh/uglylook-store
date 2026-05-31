import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const PrintifySyncLog: CollectionConfig = {
  slug: 'printify-sync-log',
  labels: { singular: 'Sync Log', plural: 'Sync Logs' },
  admin: {
    group: 'Automate',
    hidden: true,
  },
  access: {
    create: isAdmin,
    read: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    { name: 'syncId', type: 'text', required: true, index: true },
    { name: 'type', type: 'select', options: ['full', 'incremental', 'category'] },
    { name: 'triggeredBy', type: 'text' },
    { name: 'triggeredByUser', type: 'text' },
    { name: 'startedAt', type: 'date' },
    { name: 'completedAt', type: 'date' },
    { name: 'durationMs', type: 'number' },
    { name: 'status', type: 'select', options: ['completed', 'failed', 'partial'] },
    { name: 'blueprintsTotal', type: 'number' },
    { name: 'blueprintsProcessed', type: 'number' },
    { name: 'blueprintsSkipped', type: 'number' },
    { name: 'providersProcessed', type: 'number' },
    { name: 'skusScored', type: 'number' },
    { name: 'skusNew', type: 'number' },
    { name: 'skusUpdated', type: 'number' },
    { name: 'skusUnchanged', type: 'number' },
    { name: 'skusRemoved', type: 'number' },
    { name: 'skusError', type: 'number' },
    { name: 'apiCalls', type: 'number' },
    { name: 'apiErrors', type: 'number' },
    { name: 'rateLimitHits', type: 'number' },
    { name: 'changes', type: 'json' },
    { name: 'syncErrors', type: 'json' },
  ],
}
