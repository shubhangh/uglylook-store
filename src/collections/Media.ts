import type { CollectionConfig } from 'payload'
import crypto from 'crypto'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { adminOnly } from '@/access/adminOnly'
import { mediaCreateAccess, mediaDeleteAccess } from '@/access/utilities'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  admin: {
    group: 'Content',
    defaultColumns: ['filename', 'alt', 'hasHash', 'updatedAt'],
    components: {
      beforeListTable: ['@/components/Media/BackfillHashButton#BackfillHashButton'],
    },
  },
  slug: 'media',
  access: {
    create: mediaCreateAccess,   // all team + first-user setup
    delete: mediaDeleteAccess,   // owner/admin only
    read: () => true,
    update: adminOnly,           // owner/admin/manager
  },
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        // Auto-compute SHA-256 hash from the uploaded file buffer
        if (req.file?.data) {
          const hash = crypto
            .createHash('sha256')
            .update(req.file.data)
            .digest('hex')
          data.imageHash = hash
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    {
      name: 'imagePreview',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/Media/ImagePreview#ImagePreview',
        },
      },
    },
    {
      name: 'hasHash',
      type: 'checkbox',
      admin: {
        readOnly: true,
        description: 'Whether this media has an image hash',
      },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return !!siblingData?.imageHash
          },
        ],
      },
    },
    {
      name: 'imageHash',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'SHA-256 hash of the file content (auto-computed on upload)',
      },
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../public/media'),
  },
}
