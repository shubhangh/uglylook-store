'use client'
import { Product, Variant } from '@/payload-types'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

type Props = {
  product: Product
}

export const StockIndicator: React.FC<Props> = ({ product }) => {
  const searchParams = useSearchParams()

  const variants = product.variants?.docs || []

  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (product.enableVariants && variants.length) {
      const variantId = searchParams.get('variant')
      const validVariant = variants.find((variant) => {
        if (typeof variant === 'object') {
          return String(variant.id) === variantId
        }
        return String(variant) === variantId
      })

      if (validVariant && typeof validVariant === 'object') {
        return validVariant
      }
    }

    return undefined
  }, [product.enableVariants, searchParams, variants])

  const stockQuantity = useMemo(() => {
    if (product.enableVariants) {
      if (selectedVariant) {
        return selectedVariant.inventory || 0
      }
    }
    return product.inventory || 0
  }, [product.enableVariants, selectedVariant, product.inventory])

  if (product.enableVariants && !selectedVariant) {
    return null
  }

  return (
    <div className="font-mono text-[11px] uppercase tracking-widest">
      {stockQuantity > 5 && (
        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-olive-text px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          In stock
        </span>
      )}
      {stockQuantity > 0 && stockQuantity <= 5 && (
        <span className="inline-flex items-center gap-1.5 bg-destructive/10 text-destructive px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          Only {stockQuantity} left
        </span>
      )}
      {(stockQuantity === 0 || !stockQuantity) && (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          Out of stock
        </span>
      )}
    </div>
  )
}
