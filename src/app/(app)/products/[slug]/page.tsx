import type { Media, Product } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { Gallery } from '@/components/product/Gallery'
import { ProductDescription } from '@/components/product/ProductDescription'
import { ProductAccordion } from '@/components/product/ProductAccordion'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { RichText } from '@/components/RichText'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { Suspense } from 'react'

import { Metadata } from 'next'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery = product.gallery?.filter((item) => typeof item.image === 'object') || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const canIndex = product._status === 'published'

  // heroImage is the canonical thumbnail for OG/social; fall back to meta then gallery[0]
  const heroImg = typeof product.heroImage === 'object' ? (product.heroImage as Media) : undefined
  const seoImage = metaImage || heroImg || (gallery.length ? (gallery[0]?.image as Media) : undefined)

  return {
    description: product.meta?.description || '',
    openGraph: seoImage?.url
      ? {
          images: [
            {
              alt: seoImage?.alt,
              height: seoImage.height!,
              url: seoImage?.url,
              width: seoImage.width!,
            },
          ],
        }
      : null,
    robots: {
      follow: canIndex,
      googleBot: {
        follow: canIndex,
        index: canIndex,
      },
      index: canIndex,
    },
    title: product.meta?.title?.replace(/\s*[|—–-]\s*UglyLook$/i, '') || product.title,
  }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  // Build gallery with heroImage as the first item
  const rawGallery =
    product.gallery
      ?.filter((item) => typeof item.image === 'object')
      .map((item) => ({
        ...item,
        image: item.image as Media,
      })) || []

  // Prepend heroImage if it exists and isn't already the first gallery item
  const heroImg = typeof product.heroImage === 'object' ? (product.heroImage as Media) : undefined
  let gallery = rawGallery
  if (heroImg) {
    const heroAlreadyFirst = rawGallery.length > 0 && rawGallery[0].image.id === heroImg.id
    if (!heroAlreadyFirst) {
      // Remove heroImage from its current position (if in gallery) and prepend it
      const filtered = rawGallery.filter((item) => item.image.id !== heroImg.id)
      gallery = [{ image: heroImg, id: `hero-${heroImg.id}` } as any, ...filtered]
    }
  }

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const seoImage = metaImage || heroImg || (gallery.length ? (gallery[0]?.image as Media) : undefined)
  const hasStock = product.enableVariants
    ? product?.variants?.docs?.some((variant) => {
        if (typeof variant !== 'object') return false
        return variant.inventory && variant?.inventory > 0
      })
    : product.inventory! > 0

  let price = product.priceInUSD

  if (product.enableVariants && product?.variants?.docs?.length) {
    price = product?.variants?.docs?.reduce((acc, variant) => {
      if (typeof variant === 'object' && variant?.priceInUSD && acc && variant?.priceInUSD > acc) {
        return variant.priceInUSD
      }
      return acc
    }, price)
  }

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: seoImage?.url,
    url: `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/products/${product.slug}`,
    brand: { '@type': 'Brand', name: 'UglyLook' },
    ...((product as any).sku ? { sku: (product as any).sku } : {}),
    offers: {
      '@type': 'AggregateOffer',
      availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      price: price,
      priceCurrency: 'USD',
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/` },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/shop` },
      { '@type': 'ListItem', position: 3, name: product.title },
    ],
  }

  const relatedProducts =
    product.relatedProducts?.filter((relatedProduct) => typeof relatedProduct === 'object') ?? []

  return (
    <React.Fragment>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
        type="application/ld+json"
      />
      <div className="min-h-screen bg-card">
      <div className="container pt-8 pb-8">
        <nav className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.title}</span>
        </nav>
        <div className="flex flex-col gap-12 rounded-lg border border-border p-8 md:py-12 lg:flex-row lg:gap-8 bg-card">
          <div className="h-full w-full basis-full lg:basis-1/2">
            <Suspense
              fallback={
                <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden" />
              }
            >
              {Boolean(gallery?.length) && <Gallery gallery={gallery} />}
            </Suspense>
          </div>

          <div className="basis-full lg:basis-1/2">
            <ProductDescription product={product} />
            <div className="mt-8 border-t border-border">
              <ProductAccordion
                description={
                  product.description ? (
                    <RichText data={product.description} enableGutter={false} />
                  ) : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>

      {product.layout?.length ? <RenderBlocks blocks={product.layout} /> : <></>}

      {relatedProducts.length ? (
        <div className="container">
          <RelatedProducts products={relatedProducts as Product[]} />
        </div>
      ) : (
        <></>
      )}
      </div>
    </React.Fragment>
  )
}

const queryProductBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 3,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
    populate: {
      variants: {
        title: true,
        priceInUSD: true,
        inventory: true,
        options: true,
      },
    },
  })

  return result.docs?.[0] || null
}
