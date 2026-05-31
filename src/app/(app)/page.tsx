import { getCachedGlobal } from '@/utilities/getGlobals'
import { HomeClient } from './HomeClient'
import type { Homepage } from '@/payload-types'

export default async function HomePage() {
  const data = (await getCachedGlobal('homepage', 1)()) as Homepage
  return <HomeClient data={data} />
}

export async function generateMetadata() {
  const data = (await getCachedGlobal('homepage', 1)()) as Homepage
  return {
    title: data.metaTitle || 'UglyLook — Ugly is the new sick.',
    description:
      data.metaDescription ||
      'Tees, hoodies and objects too loud for the For You page. 240gsm cotton, boxy fit, dry copy, printed when you order.',
  }
}
