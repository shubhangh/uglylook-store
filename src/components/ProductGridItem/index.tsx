import type { Product, Variant } from '@/payload-types'

import Link from 'next/link'
import React from 'react'
import clsx from 'clsx'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'

type Props = {
  product: Partial<Product>
}

export const ProductGridItem: React.FC<Props> = ({ product }) => {
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
        {image ? (
          <Media
            className="relative aspect-[4/5] bg-near-black overflow-hidden"
            height={600}
            imgClassName="h-full w-full object-cover transition duration-300 ease-in-out group-hover:scale-105"
            resource={image}
            width={480}
          />
        ) : (
          <div className="aspect-[4/5] bg-near-black" />
        )}

        <div className="px-4 py-4 md:px-5 md:py-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-medium leading-tight tracking-[-0.01em]">
              {title}
            </h3>
            {typeof price === 'number' && (
              <span className="font-mono text-[13px] whitespace-nowrap text-foreground">
                <Price amount={price} />
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
