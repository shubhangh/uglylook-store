import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { ContactPage } from '@/payload-types'

export async function generateMetadata(): Promise<Metadata> {
  const data = (await getCachedGlobal('contactPage', 1)()) as ContactPage
  return {
    title: data.metaTitle || 'Contact',
    description:
      data.metaDescription ||
      'Get in touch with UglyLook. No chatbot, no ticket system. Just email.',
  }
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
