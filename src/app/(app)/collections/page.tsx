import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Media } from '@/components/Media'
import type { CollectionsPage, Category, Product, Media as MediaType } from '@/payload-types'

export async function generateMetadata(): Promise<Metadata> {
  const data = (await getCachedGlobal('collectionsPage', 1)()) as CollectionsPage
  return {
    title: data.metaTitle || 'Collections',
    description: data.metaDescription || 'Explore UglyLook collections.',
  }
}

export default async function CollectionsPageRoute() {
  const [pageData, payload] = await Promise.all([
    getCachedGlobal('collectionsPage', 1)() as Promise<CollectionsPage>,
    getPayload({ config: configPromise }),
  ])

  const customCollections = (pageData as any).collections as Array<{
    category: string | Category
    displayMode: 'image' | 'carousel'
    thumbnail?: string | MediaType | null
    carouselProducts?: (string | Product)[] | null
  }> | undefined

  // If admin configured specific collections, use those; otherwise auto-show all storefront categories
  let collectionCards: Array<{
    category: Category
    displayMode: 'image' | 'carousel'
    thumbnail: MediaType | null
    products: Product[]
  }> = []

  if (customCollections?.length) {
    for (const item of customCollections) {
      const cat = typeof item.category === 'object' ? item.category : null
      if (!cat) {
        // Resolve category by ID
        try {
          const resolved = await payload.findByID({ collection: 'categories', id: item.category as string, depth: 1 })
          if (resolved) {
            const card = await buildCard(resolved as Category, item, payload)
            collectionCards.push(card)
          }
        } catch { /* skip */ }
      } else {
        const card = await buildCard(cat, item, payload)
        collectionCards.push(card)
      }
    }
  } else {
    // Fallback: all storefront categories with image mode
    const categories = await payload.find({
      collection: 'categories',
      where: { showOnStorefront: { equals: true } },
      sort: 'title',
      limit: 20,
      depth: 1,
    })
    collectionCards = categories.docs.map((cat) => ({
      category: cat as Category,
      displayMode: 'image' as const,
      thumbnail: typeof (cat as any).coverImage === 'object' ? (cat as any).coverImage : null,
      products: [],
    }))
  }

  return (
    <div className="min-h-screen bg-card">
      <div className="container py-16 md:py-24">
        <header className="mb-12 md:mb-16">
          <h1
            className="font-sans text-4xl font-bold leading-[0.95] text-foreground md:text-6xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            {pageData.heading || 'Collections'}
          </h1>
          {pageData.subtext && (
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              {pageData.subtext}
            </p>
          )}
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collectionCards.map((card) => (
            <Link
              key={card.category.id}
              href={`/shop/${card.category.slug}`}
              className="group relative overflow-hidden rounded-lg border border-border bg-background transition-all duration-300 hover:border-foreground/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20"
            >
              <div className="aspect-[4/3] overflow-hidden bg-near-black">
                {card.displayMode === 'carousel' && card.products.length > 0 ? (
                  <CollectionCarousel products={card.products} />
                ) : card.thumbnail ? (
                  <Media
                    resource={card.thumbnail}
                    imgClassName="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                      {card.category.title}
                    </span>
                  </div>
                )}
              </div>
              <div className="px-5 py-5">
                <h2 className="text-lg font-medium text-foreground">
                  {card.category.title}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Build card data ──

async function buildCard(
  category: Category,
  item: { displayMode: 'image' | 'carousel'; thumbnail?: string | MediaType | null; carouselProducts?: (string | Product)[] | null },
  payload: any,
): Promise<{ category: Category; displayMode: 'image' | 'carousel'; thumbnail: MediaType | null; products: Product[] }> {
  const thumbnail =
    item.displayMode === 'image' && item.thumbnail && typeof item.thumbnail === 'object'
      ? (item.thumbnail as MediaType)
      : typeof (category as any).coverImage === 'object'
        ? ((category as any).coverImage as MediaType)
        : null

  let products: Product[] = []

  if (item.displayMode === 'carousel') {
    if (item.carouselProducts?.length) {
      // Admin-selected products
      products = item.carouselProducts
        .map((p) => (typeof p === 'object' ? p : null))
        .filter(Boolean) as Product[]

      // Resolve any string IDs
      if (products.length === 0 && item.carouselProducts.length > 0) {
        try {
          const resolved = await payload.find({
            collection: 'products',
            where: { and: [{ _status: { equals: 'published' } }, { id: { in: item.carouselProducts } }] },
            limit: 5,
            depth: 1,
          })
          products = resolved.docs as Product[]
        } catch { /* */ }
      }
    }

    // Auto-fill: latest 5 products in this category
    if (products.length === 0) {
      try {
        const latest = await payload.find({
          collection: 'products',
          where: {
            categories: { contains: category.id },
            _status: { equals: 'published' },
          },
          sort: '-createdAt',
          limit: 5,
          depth: 1,
        })
        products = latest.docs as Product[]
      } catch { /* */ }
    }
  }

  return { category, displayMode: item.displayMode, thumbnail, products }
}

// ── Collection Carousel Component ──

function CollectionCarousel({ products }: { products: Product[] }) {
  const images = products
    .map((p) => {
      const hero = p.heroImage && typeof p.heroImage === 'object' ? (p.heroImage as MediaType) : null
      const galleryFirst =
        p.gallery?.[0]?.image && typeof p.gallery[0].image === 'object'
          ? (p.gallery[0].image as MediaType)
          : null
      return hero || galleryFirst
    })
    .filter(Boolean) as MediaType[]

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
          No products
        </span>
      </div>
    )
  }

  // CSS-only auto-scrolling carousel
  const totalWidth = images.length * 100
  return (
    <div className="w-full h-full overflow-hidden relative">
      <div
        className="flex h-full animate-collection-scroll"
        style={{
          width: `${totalWidth}%`,
          animationDuration: `${images.length * 3}s`,
        }}
      >
        {images.map((img, i) => (
          <div key={img.id || i} className="h-full" style={{ width: `${100 / images.length}%` }}>
            <Media
              resource={img}
              imgClassName="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
