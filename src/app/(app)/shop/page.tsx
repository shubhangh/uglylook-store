import { ProductGrid } from '@/components/shop/ProductGrid'
import { ShopControls } from '@/components/shop/ShopControls'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

export const metadata = {
  title: 'Shop',
  description:
    'Browse the full UglyLook catalog. Tees, hoodies, hats and objects. 240gsm cotton, boxy fit, DTG printed.',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ShopPage({ searchParams }: Props) {
  const { q: searchValue, sort, category } = await searchParams
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    limit: 20,
    sort: 'title',
    where: { showOnStorefront: { equals: true } },
  })

  const products = await payload.find({
    collection: 'products',
    depth: 2,
    limit: 12,
    select: {
      title: true,
      slug: true,
      heroImage: true,
      gallery: true,
      categories: true,
      priceInUSD: true,
      createdAt: true,
    },
    ...(sort ? { sort } : { sort: 'title' }),
    where: {
      and: [
        { _status: { equals: 'published' } },
        { heroImage: { exists: true } },
        ...(searchValue
          ? [
              {
                or: [
                  { title: { like: searchValue } },
                  { description: { like: searchValue } },
                ],
              },
            ]
          : []),
        ...(category
          ? [{ categories: { contains: category } }]
          : []),
      ],
    },
  })
  const resultsText = products.totalDocs > 1 ? 'results' : 'result'
  const sortValue = typeof sort === 'string' ? sort : 'title'
  const categoryValue = typeof category === 'string' ? category : undefined
  const searchString = typeof searchValue === 'string' ? searchValue : undefined

  return (
    <div>
      <ShopControls categories={categories.docs} />

      {searchString ? (
        <p className="mb-6 text-sm text-muted-foreground">
          {products.totalDocs === 0 ? (
            <>
              Nothing matches &quot;<span className="text-foreground font-medium">{searchString}</span>&quot;. Try something else or{' '}
              <a href="/shop" className="text-olive-text underline underline-offset-4 hover:text-foreground transition-colors">browse everything</a>.
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">{products.totalDocs}</span> {resultsText} for &quot;<span className="text-foreground font-medium">{searchString}</span>&quot;
            </>
          )}
        </p>
      ) : (
        <p className="mb-6 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
          {products.totalDocs} products
        </p>
      )}

      {products.docs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-2">Nothing here.</p>
          <p className="text-sm text-muted-foreground">That&rsquo;s on you. Try a different filter.</p>
        </div>
      )}

      {products.docs.length > 0 && (
        <ProductGrid
          initialProducts={products.docs}
          totalDocs={products.totalDocs}
          sort={sortValue}
          category={categoryValue}
          searchQuery={searchString}
        />
      )}
    </div>
  )
}
