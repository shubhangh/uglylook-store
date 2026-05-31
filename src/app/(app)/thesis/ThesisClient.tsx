'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { getClientSideURL } from '@/utilities/getURL'
import type { ThesisPage } from '@/payload-types'

type Props = { data: ThesisPage }

export function ThesisClient({ data: initialData }: Props) {
  const { data } = useLivePreview<ThesisPage>({
    initialData,
    serverURL: getClientSideURL(),
    depth: 1,
  })

  const visibleColumns = (data.columns ?? []).filter((col) => col.visible ?? true)

  return (
    <section className="min-h-screen bg-card py-16 md:py-24">
      <div className="container">
        {/* ── Section Header ── */}
        {(data.showHeader ?? true) && (
          <header className="mb-16 md:mb-24">
            <span className="font-mono text-[11px] tracking-widest text-olive-text uppercase">
              {data.sectionNumber || 'SEC / 03'}
            </span>
            <h1 className="mt-4 font-sans text-4xl font-bold leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-7xl"
              style={{ letterSpacing: '-0.03em' }}
            >
              {(data.heading || 'The thesis.\nIn writing.').split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="mt-4 font-mono text-xs tracking-wide text-muted-foreground">
              {data.subheading || 'Why the name works \u00b7 why the filter is permanent'}
            </p>
          </header>
        )}

        {/* ── Lede ── */}
        {(data.showLede ?? true) && (
          <p className="mb-16 max-w-3xl text-base leading-[1.6] text-foreground/80 md:text-lg md:leading-[1.6]">
            {data.lede || 'Every generation invents new slang for "good," and every word started its life meaning bad. We\'re just the first ones putting it on the chest.'}
          </p>
        )}

        {/* ── Three Columns ── */}
        {(data.showColumns ?? true) && (
          <div className="mb-16 grid gap-12 md:grid-cols-3 md:gap-8">
            {visibleColumns.map((col, index) => {
              const num = String(index + 1).padStart(2, '0')
              return (
                <div key={col.id || index}>
                  <h3 className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-olive-text">
                    <span className="block h-px w-[18px] flex-shrink-0 bg-olive" />
                    {num}. {col.heading}
                  </h3>
                  <div className="space-y-4 text-base leading-[1.6] text-foreground/70">
                    {col.paragraph1 && <p>{col.paragraph1}</p>}
                    {col.paragraph2 && <p>{col.paragraph2}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Rules ── */}
        {(data.showRules ?? true) && (
          <dl className="border-t border-border pt-8">
            <dt className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-olive-text">
              <span className="block h-px w-[18px] flex-shrink-0 bg-olive" />
              {data.rulesTerm || 'What we don\u2019t do'}
            </dt>
            <dd className="max-w-3xl font-mono text-sm leading-[1.8] text-muted-foreground">
              {data.rulesDefinition || '\u201cCurated.\u201d Founder selfies. Points programs. Referral wheels. 10%-off-for-your-email popups. Mountain hero shots. Coffee-cup lifestyle. Black Friday in the standard way. Performing Gen\u00a0Z in the copy. Soft pastel anything. Recoloring the logo. Explaining the joke.'}
            </dd>
          </dl>
        )}
      </div>
    </section>
  )
}
