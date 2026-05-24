import { getCachedGlobal } from '@/utilities/getGlobals'
import { FrameMarks } from '@/components/brand/frame-marks'
import { HeroSection } from '@/components/brand/hero-section'
import { MarqueeTape } from '@/components/brand/marquee-tape'
import { PullQuote } from '@/components/brand/pull-quote'
import { ManifestoSection } from '@/components/brand/manifesto-section'
import { SpecSection } from '@/components/brand/spec-section'
import { DropSection } from '@/components/brand/drop-section'
import type { Homepage } from '@/payload-types'

export default async function HomePage() {
  const data = (await getCachedGlobal('homepage', 1)()) as Homepage
  return (
    <>
      {(data.showFrameMarks ?? true) && <FrameMarks />}
      {(data.showHero ?? true) && <HeroSection data={data} />}
      {(data.showMarquee ?? true) && <MarqueeTape data={data} />}
      {(data.showPullQuote ?? true) && <PullQuote data={data} />}
      {(data.showManifesto ?? true) && <ManifestoSection data={data} />}
      {(data.showSpec ?? true) && <SpecSection data={data} />}
      {(data.showDrop ?? true) && <DropSection data={data} />}
    </>
  )
}

export async function generateMetadata() {
  const data = (await getCachedGlobal('homepage', 1)()) as Homepage
  return {
    title: data.metaTitle || 'UglyLook — Ugly is the new sick.',
    description:
      data.metaDescription ||
      'Tees, hoodies and objects too loud for the For You page. 240gsm cotton, boxy fit, dry copy, printed when you order.',
  }
}
