'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { getClientSideURL } from '@/utilities/getURL'
import type { LanesPage } from '@/payload-types'

type Props = { data: LanesPage }

export function LanesClient({ data: initialData }: Props) {
  const { data } = useLivePreview<LanesPage>({
    initialData,
    serverURL: getClientSideURL(),
    depth: 1,
  })

  const visibleLanes = (data.lanes ?? []).filter((lane) => lane.visible ?? true)

  return (
    <section className="min-h-screen bg-card py-16 md:py-24">
      <div className="container">
        {/* ── Section Header ── */}
        {(data.showHeader ?? true) && (
          <header className="mb-16 md:mb-24">
            <span className="font-mono text-[11px] tracking-widest text-olive-text uppercase">
              {data.sectionNumber || 'SEC / 04'}
            </span>
            <h1
              className="mt-4 font-sans text-4xl font-bold leading-[0.95] text-foreground md:text-6xl lg:text-7xl"
              style={{ letterSpacing: '-0.03em' }}
            >
              {(data.heading || 'Five lanes.\nThat\u2019s the catalog.').split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="mt-4 font-mono text-xs tracking-wide text-muted-foreground">
              {data.subheading || 'No drift \u00b7 no "athletic" \u00b7 no "soft and feminine" \u00b7 no kids'}
            </p>
          </header>
        )}

        {/* ── Lane List ── */}
        {(data.showLanes ?? true) && (
          <div className="mb-16">
            {visibleLanes.map((lane) => {
              const num = lane.number.replace('L.', '')
              return (
                <div
                  key={lane.id || lane.number}
                  className="group grid gap-4 border-t border-border py-8 transition-all duration-200 hover:bg-card hover:px-6 md:grid-cols-[140px_1fr] md:gap-10 md:py-10"
                >
                  {/* Number column */}
                  <div className="flex items-baseline gap-4 md:flex-col md:gap-1">
                    <span className="font-mono text-[11px] tracking-widest text-olive-text uppercase">
                      {lane.number}
                    </span>
                    <span
                      className="font-sans text-[32px] font-bold leading-none text-foreground/10 md:text-[56px]"
                      style={{ letterSpacing: '-0.04em' }}
                    >
                      {num}
                    </span>
                  </div>

                  {/* Content column */}
                  <div className="flex flex-col justify-center">
                    <h3
                      className="mb-2 font-sans text-xl font-bold text-foreground md:text-2xl"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {lane.name}
                    </h3>
                    <p className="max-w-xl text-[15px] leading-[1.6] text-muted-foreground">
                      {lane.description}
                    </p>
                  </div>
                </div>
              )
            })}
            {/* Close bottom border */}
            <div className="border-t border-border" />
          </div>
        )}

        {/* ── Negative Space Box ── */}
        {(data.showNegativeBox ?? true) && (
          <div className="rounded-sm border border-dashed border-border p-8 md:p-10">
            <span className="mb-3 block font-mono text-[11px] tracking-widest text-olive-text uppercase">
              {data.negativeBoxLabel || 'Not in the catalog'}
            </span>
            <span className="text-[15px] leading-[1.6] text-muted-foreground">
              {data.negativeBoxContent || 'clean minimalism \u00b7 soft / feminine \u00b7 athletic / performance \u00b7 luxury polish \u00b7 kids & family \u00b7 anything that needs the joke explained.'}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
