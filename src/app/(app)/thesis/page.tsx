import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { ThesisPage } from '@/payload-types'
import { ThesisClient } from './ThesisClient'

export async function generateMetadata(): Promise<Metadata> {
  const data = (await getCachedGlobal('thesisPage', 1)()) as ThesisPage
  return {
    title: data.metaTitle || 'The Thesis',
    description:
      data.metaDescription ||
      'Why "ugly" is a compliment. The brand philosophy behind UglyLook\'s design discipline.',
  }
}

export default async function ThesisPageRoute() {
  const data = (await getCachedGlobal('thesisPage', 1)()) as ThesisPage
  return <ThesisClient data={data} />
}
