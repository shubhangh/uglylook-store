import { getCachedGlobal } from '@/utilities/getGlobals'
import type { FaqPage } from '@/payload-types'
import { FaqClient } from './FaqClient'

export default async function FAQPage() {
  const data = (await getCachedGlobal('faqPage', 1)()) as FaqPage
  return <FaqClient data={data} />
}
