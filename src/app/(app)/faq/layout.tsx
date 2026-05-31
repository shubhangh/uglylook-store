import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { FaqPage } from '@/payload-types'

export async function generateMetadata(): Promise<Metadata> {
  const data = (await getCachedGlobal('faqPage', 1)()) as FaqPage
  return {
    title: data.metaTitle || 'FAQ',
    description:
      data.metaDescription ||
      'Common questions about UglyLook orders, shipping, returns, sizing and care.',
  }
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
