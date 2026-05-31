import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { ShippingReturnsPage } from '@/payload-types'
import { ShippingReturnsClient } from './ShippingReturnsClient'

export async function generateMetadata(): Promise<Metadata> {
  const data = (await getCachedGlobal('shippingReturnsPage', 1)()) as ShippingReturnsPage
  return {
    title: data.metaTitle || 'Shipping & Returns',
    description:
      data.metaDescription ||
      'Shipping info, return policy, and international fulfillment details.',
  }
}

export default async function ShippingReturnsPageRoute() {
  const data = (await getCachedGlobal('shippingReturnsPage', 1)()) as ShippingReturnsPage
  return <ShippingReturnsClient data={data} />
}
