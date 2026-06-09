import { ProductGrid } from '@/components/shop/ProductGrid'
import { ShopControls } from '@/components/shop/ShopControls'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import type { Metadata } from 'next'

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
    title: cat.title,
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

  // Fetch all storefront categories for the filter bar
  const allCategories = await payload.find({
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
    },
    ...(sort ? { sort } : { sort: 'title' }),
    where: {
      and: [
        { heroImage: { exists: true } },
        { _status: { equals: 'published' } },
        { categories: { contains: category.id } },
      ],
    },
  })

  const sortValue = typeof sort === 'string' ? sort : 'title'

  return (
    <div>
      <ShopControls categories={allCategories.docs} activeCategory={categorySlug} />

      <p className="mb-6 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
        {products.totalDocs} {products.totalDocs === 1 ? 'piece' : 'pieces'}
      </p>

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
        <ProductGrid
          initialProducts={products.docs}
          totalDocs={products.totalDocs}
          sort={sortValue}
          category={categorySlug}
        />
      )}
    </div>
  )
}
