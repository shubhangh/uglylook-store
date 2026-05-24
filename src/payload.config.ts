import { mongooseAdapter } from '@payloadcms/db-mongodb'

import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { Users } from '@/collections/Users'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { HomepageConfig } from '@/globals/HomepageConfig'
import { ThesisPageConfig } from '@/globals/ThesisPageConfig'
import { LanesPageConfig } from '@/globals/LanesPageConfig'
import { DropPageConfig } from '@/globals/DropPageConfig'
import { ContactPageConfig } from '@/globals/ContactPageConfig'
import { FaqPageConfig } from '@/globals/FaqPageConfig'
import { ShippingReturnsConfig, SizeGuideConfig, PrivacyConfig, TermsConfig } from '@/globals/InfoPageConfigs'
import { plugins } from './plugins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  routes: {
    admin: '/adm',
  },
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
      beforeNavLinks: ['@/components/admin/DashboardLink#DashboardLink'],
      graphics: {
        Logo: '@/components/admin/Logo#Logo',
        Icon: '@/components/admin/Icon#Icon',
      },
    },
    avatar: {
      Component: '@/components/admin/Avatar#Avatar',
    },
    meta: {
      titleSuffix: ' | UglyLook Admin',
      icons: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          url: '/favicon.svg',
        },
      ],
    },
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname, 'app/(payload)/adm'),
    },
  },
  collections: [Users, Pages, Posts, Categories, Media],
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  //email: nodemailerAdapter(),
  endpoints: [],
  globals: [
    Header,
    Footer,
    HomepageConfig,
    ThesisPageConfig,
    LanesPageConfig,
    DropPageConfig,
    ContactPageConfig,
    FaqPageConfig,
    ShippingReturnsConfig,
    SizeGuideConfig,
    PrivacyConfig,
    TermsConfig,
  ],
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // sharp,
})
