import Link from 'next/link'
import { ProductGridItem } from '@/components/ProductGridItem'
import type { Homepage, Product } from '@/payload-types'

type Props = {
  data: Homepage
  products: Product[]
}

export function FeaturedProducts({ data, products }: Props) {
  if (!products.length) return null

  return (
    <section className="py-16 md:py-24 bg-cream dark:bg-background border-t border-border">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <h2
            className="font-sans text-2xl font-bold text-foreground md:text-3xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            {data.featuredHeading || 'Featured'}
          </h2>
          <Link
            href={data.featuredCtaUrl || '/shop'}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {data.featuredCtaText || 'Shop all'} &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {products.map((product) => (
            <ProductGridItem key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
