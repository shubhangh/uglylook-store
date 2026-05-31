import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { SizeGuidePage } from '@/payload-types'
import { SizeGuideClient } from './SizeGuideClient'

export async function generateMetadata(): Promise<Metadata> {
  const data = (await getCachedGlobal('sizeGuidePage', 1)()) as SizeGuidePage
  return {
    title: data.metaTitle || 'Size Guide',
    description:
      data.metaDescription || 'Sizing charts and fit guide for UglyLook apparel.',
  }
}

export default async function SizeGuidePageRoute() {
  const data = (await getCachedGlobal('sizeGuidePage', 1)()) as SizeGuidePage
  return <SizeGuideClient data={data} />
}
