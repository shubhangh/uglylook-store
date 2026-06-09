import { getCachedGlobal } from '@/utilities/getGlobals'
import { HomeClient } from './HomeClient'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Homepage, Product, Media } from '@/payload-types'
import type { CarouselItem } from '@/components/brand/image-carousel'

export default async function HomePage() {
  const data = (await getCachedGlobal('homepage', 2)()) as Homepage
  const payload = await getPayload({ config: configPromise })

  // Fetch featured products — use CMS selection or fall back to newest
  let featuredProducts: Product[] = []

  const selectedIds = (data.featuredProducts || [])
    .map((p: any) => (typeof p === 'object' ? p.id : p))
    .filter(Boolean)

  if (selectedIds.length > 0) {
    const result = await payload.find({
      collection: 'products',
      where: { and: [{ _status: { equals: 'published' } }, { id: { in: selectedIds } }] },
      limit: 6,
      depth: 2,
    })
    featuredProducts = result.docs as Product[]
  } else {
    const result = await payload.find({
      collection: 'products',
      where: { and: [{ _status: { equals: 'published' } }, { heroImage: { exists: true } }] },
      sort: '-createdAt',
      limit: 6,
      depth: 2,
    })
    featuredProducts = result.docs as Product[]
  }

  // Fetch product hero images for carousel (above footer)
  const allProducts = await payload.find({
    collection: 'products',
    where: { and: [{ _status: { equals: 'published' } }, { heroImage: { exists: true } }] },
    sort: '-createdAt',
    limit: 12,
    depth: 2,
    select: { heroImage: true, gallery: true, title: true, slug: true },
  })

  const carouselItems: CarouselItem[] = allProducts.docs
    .map((p) => {
      const hero = p.heroImage && typeof p.heroImage === 'object' ? p.heroImage : null
      const fallback = p.gallery?.[0]?.image && typeof p.gallery[0].image === 'object' ? p.gallery[0].image as Media : null
      const image = hero || fallback
      return image ? { image, slug: p.slug || '' } : null
    })
    .filter((item): item is CarouselItem => item !== null)

  return (
    <HomeClient
      data={data}
      featuredProducts={featuredProducts}
      carouselItems={carouselItems.slice(0, 10)}
    />
  )
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
