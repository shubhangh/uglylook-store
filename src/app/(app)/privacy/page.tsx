import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { PrivacyPage } from '@/payload-types'
import { PrivacyClient } from './PrivacyClient'

export async function generateMetadata(): Promise<Metadata> {
  const data = (await getCachedGlobal('privacyPage', 1)()) as PrivacyPage
  return {
    title: data.metaTitle || 'Privacy Policy',
    description:
      data.metaDescription || 'How UglyLook handles your data. Short version: carefully.',
  }
}

export default async function PrivacyPageRoute() {
  const data = (await getCachedGlobal('privacyPage', 1)()) as PrivacyPage
  return <PrivacyClient data={data} />
}
