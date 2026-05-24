import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import { ScrollFadeIn } from '@/components/ScrollFadeIn'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Shop',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ShopPage({ searchParams }: Props) {
  const { q: searchValue, sort, category } = await searchParams
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInUSD: true,
    },
    ...(sort ? { sort } : { sort: 'title' }),
    ...(searchValue || category
      ? {
          where: {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              ...(searchValue
                ? [
                    {
                      or: [
                        {
                          title: {
                            like: searchValue,
                          },
                        },
                        {
                          description: {
                            like: searchValue,
                          },
                        },
                      ],
                    },
                  ]
                : []),
              ...(category
                ? [
                    {
                      categories: {
                        contains: category,
                      },
                    },
                  ]
                : []),
            ],
          },
        }
      : {}),
  })

  const resultsText = products.docs.length > 1 ? 'results' : 'result'

  return (
    <div>
      {searchValue ? (
        <p className="mb-6 text-sm text-muted-foreground">
          {products.docs?.length === 0 ? (
            <>
              Nothing matches &quot;<span className="text-foreground font-medium">{searchValue}</span>&quot;. Try something else or{' '}
              <a href="/shop" className="text-olive-text underline underline-offset-4 hover:text-foreground transition-colors">browse everything</a>.
            </>
          ) : (
            <>
              <span className="font-mono text-foreground">{products.docs.length}</span> {resultsText} for &quot;<span className="text-foreground font-medium">{searchValue}</span>&quot;
            </>
          )}
        </p>
      ) : (
        <p className="mb-6 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
          {products.docs.length} products
        </p>
      )}

      {!searchValue && products.docs?.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-2">Nothing here.</p>
          <p className="text-sm text-muted-foreground">That&rsquo;s on you. Try a different filter.</p>
        </div>
      )}

      {products?.docs.length > 0 ? (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.docs.map((product, i) => {
            return (
              <ScrollFadeIn key={product.id} delay={i * 60}>
                <ProductGridItem product={product} />
              </ScrollFadeIn>
            )
          })}
        </Grid>
      ) : null}
    </div>
  )
}
