import { mongooseAdapter } from '@payloadcms/db-mongodb'

import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  HeadingFeature,
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

import { Buckets } from '@/collections/Buckets'
import { Categories } from '@/collections/Categories'
import { Coupons } from '@/collections/Coupons'
import { Offers } from '@/collections/Offers'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { Redirects } from '@/collections/Redirects'
import { Subscribers } from '@/collections/Subscribers'
import { Team } from '@/collections/Team'
import { MyKeys } from '@/collections/MyKeys'
import { GlobalKeys } from '@/collections/GlobalKeys'
import { Customers } from '@/collections/Customers'
import { R2Browser } from '@/collections/R2Browser'
import { BulkUploads } from '@/collections/BulkUploads'
import { BulkReads } from '@/collections/BulkReads'
import { BulkFeedback } from '@/collections/BulkFeedback'
import { AIProductAnalysisCache } from '@/collections/AIProductAnalysisCache'
import { WorkflowGuide } from '@/collections/WorkflowGuide'
import { PrintifyFulfillment } from '@/collections/PrintifyFulfillment'
import { PrintifyCatalog } from '@/collections/PrintifyCatalog'
import { PrintifyLauncher } from '@/collections/PrintifyLauncher'
import { PrintifyAnalysis } from '@/collections/PrintifyAnalysis'
import { PrintifyCatalogCache } from '@/collections/PrintifyCatalogCache'
import { PrintifySyncLog } from '@/collections/PrintifySyncLog'
import { Designs } from '@/collections/Designs'
import { AIGraphics } from '@/collections/AIGraphics'
import { DesignPresets } from '@/collections/DesignPresets'
import { AIModelRegistry } from '@/collections/AIModelRegistry'
import { PrintifyDesignStudio } from '@/collections/PrintifyDesignStudio'
import { AnnouncementBar } from '@/globals/AnnouncementBar'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { HomepageConfig } from '@/globals/HomepageConfig'
import { ThesisPageConfig } from '@/globals/ThesisPageConfig'
import { LanesPageConfig } from '@/globals/LanesPageConfig'
import { DropPageConfig } from '@/globals/DropPageConfig'
import { ContactPageConfig } from '@/globals/ContactPageConfig'
import { FaqPageConfig } from '@/globals/FaqPageConfig'
import { ShippingReturnsConfig, SizeGuideConfig, PrivacyConfig, TermsConfig } from '@/globals/InfoPageConfigs'
import { PrintifyDefaults } from '@/globals/PrintifyDefaults'
import { AISettings } from '@/globals/AISettings'
import { resendAdapter } from '@payloadcms/email-resend'
import { plugins } from './plugins'
import { startPrintifyCron } from '@/lib/printify-cron'
import { seedAIModels } from '@/lib/seed-ai-models'

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
      providers: [
        '@/components/admin/PasswordToggle#PasswordToggle',
        '@/components/admin/RoleRestrictions#RoleRestrictions',
      ],
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
    user: Team.slug,
    importMap: {
      baseDir: path.resolve(dirname, 'app/(payload)/adm'),
    },
  },
  collections: [Customers, Pages, Posts, Categories, Media, Team, GlobalKeys, MyKeys, Subscribers, Redirects, Coupons, Offers, Buckets, AIGraphics, Designs, PrintifyCatalog, PrintifyLauncher, PrintifyDesignStudio, PrintifyAnalysis, PrintifyFulfillment, DesignPresets, AIModelRegistry, PrintifyCatalogCache, PrintifySyncLog, R2Browser, BulkUploads, BulkReads, BulkFeedback, AIProductAnalysisCache, WorkflowGuide],
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
    connectOptions: {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
    },
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
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
  onInit: async (payload) => {
    seedAIModels(payload)
    startPrintifyCron(payload)
  },
  endpoints: [],
  globals: [
    AnnouncementBar,
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
    PrintifyDefaults,
    AISettings,
  ],
  email: resendAdapter({
    defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'orders@uglylook.com',
    defaultFromName: 'UglyLook',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
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
