import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import { ScrollFadeIn } from '@/components/ScrollFadeIn'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import Link from 'next/link'

import { Metadata } from 'next'

type Args = {
  params: Promise<{ category: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { category: categorySlug } = await params
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    where: {
      and: [
        { slug: { equals: categorySlug } },
        { showOnStorefront: { equals: true } },
      ],
    },
    limit: 1,
  })

  const cat = categories.docs[0]
  if (!cat) return { title: 'Shop' }

  return {
    title: `${cat.title} — UglyLook`,
    description: `Shop ${cat.title} from UglyLook. Ugly is the new sick.`,
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    where: { showOnStorefront: { equals: true } },
  })

  return categories.docs.map((cat) => ({
    category: cat.slug,
  }))
}

export default async function CategoryPage({ params, searchParams }: Args) {
  const { category: categorySlug } = await params
  const { sort } = await searchParams
  const payload = await getPayload({ config: configPromise })

  // Find the category by slug — only storefront categories
  const categories = await payload.find({
    collection: 'categories',
    where: {
      and: [
        { slug: { equals: categorySlug } },
        { showOnStorefront: { equals: true } },
      ],
    },
    limit: 1,
  })

  const category = categories.docs[0]
  if (!category) return notFound()

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
    where: {
      and: [
        { _status: { equals: 'published' } },
        { categories: { contains: category.id } },
      ],
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/shop"
          className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
        >
          All
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-mono text-[11px] text-foreground uppercase tracking-widest">
          {category.title}
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {products.docs.length} {products.docs.length === 1 ? 'piece' : 'pieces'}
        </span>
      </div>

      {products.docs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-2">Nothing here yet.</p>
          <p className="text-sm text-muted-foreground">
            Check back later or{' '}
            <Link href="/shop" className="text-olive-text underline underline-offset-4 hover:text-foreground transition-colors">
              browse everything
            </Link>.
          </p>
        </div>
      )}

      {products.docs.length > 0 && (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.docs.map((product, i) => (
            <ScrollFadeIn key={product.id} delay={i * 60}>
              <ProductGridItem product={product} priority={i < 4} />
            </ScrollFadeIn>
          ))}
        </Grid>
      )}
    </div>
  )
}
