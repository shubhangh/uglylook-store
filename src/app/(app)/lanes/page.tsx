import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { LanesPage } from '@/payload-types'
import { LanesClient } from './LanesClient'

export async function generateMetadata(): Promise<Metadata> {
  const data = (await getCachedGlobal('lanesPage', 1)()) as LanesPage
  return {
    title: data.metaTitle || 'Design Lanes',
    description:
      data.metaDescription ||
      'Five design lanes, zero drift. Maximalist collage, ironic text, weirdcore, anti-design, Y2K.',
  }
}

export default async function LanesPageRoute() {
  const data = (await getCachedGlobal('lanesPage', 1)()) as LanesPage
  return <LanesClient data={data} />
}
