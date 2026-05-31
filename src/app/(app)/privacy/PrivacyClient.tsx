'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { getClientSideURL } from '@/utilities/getURL'
import type { PrivacyPage } from '@/payload-types'

type Props = { data: PrivacyPage }

export function PrivacyClient({ data: initialData }: Props) {
  const { data } = useLivePreview<PrivacyPage>({
    initialData,
    serverURL: getClientSideURL(),
    depth: 1,
  })

  const visibleSections = (data.sections ?? []).filter((s) => s.visible ?? true)

  return (
    <section className="min-h-screen bg-background py-16 md:py-24">
      <div className="container max-w-3xl">
        {/* Section Header */}
        <header className="mb-16 md:mb-24">
          <span className="font-mono text-[11px] tracking-widest text-olive-text uppercase">
            {data.sectionLabel || 'LEGAL / 01'}
          </span>
          <h1
            className="mt-4 font-sans text-4xl font-bold leading-[0.95] text-foreground md:text-6xl lg:text-7xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            {data.heading || 'Privacy.'}
          </h1>
          <p className="mt-6 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
            {data.lastUpdated || 'Last updated: January 2026'}
          </p>
        </header>

        <div className="space-y-12">
          {visibleSections.map((section) => {
            const visibleListItems = (section.listItems ?? []).filter((item) => item.visible ?? true)
            return (
              <div key={section.id || section.number}>
                <h2 className="font-mono text-[10px] uppercase tracking-widest text-olive-text mb-6 flex items-center gap-2.5">
                  <span className="w-[18px] h-px bg-olive inline-block" />
                  {section.number}. {section.title}
                </h2>
                <div className="space-y-4 text-base leading-[1.7] text-foreground/70 [&_ul]:space-y-2 [&_ul]:ml-4 [&_li]:flex [&_li]:items-start [&_li]:gap-3 [&_li]:before:content-[''] [&_li]:before:w-1 [&_li]:before:h-1 [&_li]:before:rounded-full [&_li]:before:bg-olive [&_li]:before:mt-3 [&_li]:before:flex-shrink-0">
                  {visibleListItems.length > 0 && (
                    <ul>
                      {visibleListItems.map((item) => (
                        <li key={item.id || item.text}>{item.text}</li>
                      ))}
                    </ul>
                  )}
                  {section.paragraph && section.paragraph.split('\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
