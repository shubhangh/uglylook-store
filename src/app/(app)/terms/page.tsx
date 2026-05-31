import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { TermsPage } from '@/payload-types'
import { TermsClient } from './TermsClient'

export async function generateMetadata(): Promise<Metadata> {
  const data = (await getCachedGlobal('termsPage', 1)()) as TermsPage
  return {
    title: data.metaTitle || 'Terms of Service',
    description:
      data.metaDescription || 'Terms and conditions for using UglyLook.',
  }
}

export default async function TermsPageRoute() {
  const data = (await getCachedGlobal('termsPage', 1)()) as TermsPage
  return <TermsClient data={data} />
}
