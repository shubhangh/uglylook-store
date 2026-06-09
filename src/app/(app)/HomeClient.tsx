'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { getClientSideURL } from '@/utilities/getURL'
import { FrameMarks } from '@/components/brand/frame-marks'
import { HeroSection } from '@/components/brand/hero-section'
import { MarqueeTape } from '@/components/brand/marquee-tape'
import { PullQuote } from '@/components/brand/pull-quote'
import { BrandStatement } from '@/components/brand/brand-statement'
import { FeaturedProducts } from '@/components/brand/featured-products'
import { ImageCarousel, type CarouselItem } from '@/components/brand/image-carousel'
import type { Homepage, Product } from '@/payload-types'

type Props = {
  data: Homepage
  featuredProducts: Product[]
  carouselItems: CarouselItem[]
}

export function HomeClient({ data: initialData, featuredProducts, carouselItems }: Props) {
  const { data } = useLivePreview<Homepage>({
    initialData,
    serverURL: getClientSideURL(),
    depth: 1,
  })

  return (
    <>
      {(data.showFrameMarks ?? true) && <FrameMarks />}
      {(data.showHero ?? true) && <HeroSection data={data} featuredProducts={featuredProducts} />}
      {(data.showMarquee ?? true) && <MarqueeTape data={data} />}
      {(data.showFeaturedProducts ?? true) && (
        <FeaturedProducts data={data} products={featuredProducts} />
      )}
      <BrandStatement data={data} />
      {(data.showPullQuote ?? true) && <PullQuote data={data} />}
      <ImageCarousel items={carouselItems} data={data} />
    </>
  )
}
