import type { Category, Product, Variant } from '@/payload-types'

import Link from 'next/link'
import React from 'react'
import clsx from 'clsx'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'

function isNew(createdAt?: string): boolean {
  if (!createdAt) return false
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  return new Date(createdAt).getTime() > thirtyDaysAgo
}

type Props = {
  product: Partial<Product>
  priority?: boolean
}

export const ProductGridItem: React.FC<Props> = ({ product, priority }) => {
  const { gallery, priceInUSD, title } = product

  let price = priceInUSD

  const variants = product.variants?.docs

  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInUSD &&
      typeof variant.priceInUSD === 'number'
    ) {
      price = variant.priceInUSD
    }
  }

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  return (
    <Link
      className="relative inline-block h-full w-full group"
      href={`/products/${product.slug}`}
    >
      <article className="overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 ease-out group-hover:border-foreground/30 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-black/20">
        <div className="relative">
          {image ? (
            <Media
              className="relative aspect-[4/5] bg-near-black overflow-hidden"
              height={600}
              imgClassName="h-full w-full object-cover transition duration-300 ease-in-out group-hover:scale-105"
              priority={priority}
              resource={image}
              width={480}
            />
          ) : (
            <div className="aspect-[4/5] bg-near-black" />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {isNew(product.createdAt) && (
              <span className="font-mono text-[10px] uppercase tracking-widest bg-olive text-cream px-2 py-0.5 rounded-sm">
                New
              </span>
            )}
            {product.categories?.[0] && typeof product.categories[0] === 'object' && (
              <span className="font-mono text-[10px] uppercase tracking-widest bg-background/70 backdrop-blur-sm text-foreground px-2 py-0.5 rounded-sm border border-border/50">
                {(product.categories[0] as Category).title}
              </span>
            )}
          </div>
        </div>

        <div className="px-4 py-4 md:px-5 md:py-5 h-[60px] flex items-center">
          <div className="flex items-center justify-between gap-3 w-full min-w-0">
            <h3 className="text-[15px] font-medium leading-tight tracking-[-0.01em] truncate min-w-0">
              {title}
            </h3>
            {typeof price === 'number' && (
              <span className="font-mono text-[13px] whitespace-nowrap text-foreground shrink-0">
                <Price amount={price} />
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
