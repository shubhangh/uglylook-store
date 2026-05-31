import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { DropPage } from '@/payload-types'
import { DropClient } from './DropClient'

export async function generateMetadata(): Promise<Metadata> {
  const data = (await getCachedGlobal('dropPage', 1)()) as DropPage
  return {
    title: data.metaTitle || 'Next Drop',
    description:
      data.metaDescription ||
      "The next UglyLook drop. We don't do countdowns — but here's when it opens.",
  }
}

export default async function DropPageRoute() {
  const data = (await getCachedGlobal('dropPage', 1)()) as DropPage
  return <DropClient data={data} />
}
