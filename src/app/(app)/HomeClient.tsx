'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { getClientSideURL } from '@/utilities/getURL'
import { FrameMarks } from '@/components/brand/frame-marks'
import { HeroSection } from '@/components/brand/hero-section'
import { MarqueeTape } from '@/components/brand/marquee-tape'
import { PullQuote } from '@/components/brand/pull-quote'
import { ManifestoSection } from '@/components/brand/manifesto-section'
import { SpecSection } from '@/components/brand/spec-section'
import { DropSection } from '@/components/brand/drop-section'
import type { Homepage } from '@/payload-types'

type Props = { data: Homepage }

export function HomeClient({ data: initialData }: Props) {
  const { data } = useLivePreview<Homepage>({
    initialData,
    serverURL: getClientSideURL(),
    depth: 1,
  })

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
