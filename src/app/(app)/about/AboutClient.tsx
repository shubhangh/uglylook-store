'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { getClientSideURL } from '@/utilities/getURL'
import { Media } from '@/components/Media'
import { getImageDisplayStyles } from '@/utilities/imageDisplay'
import type { AboutPage, ThesisPage, LanesPage, Homepage } from '@/payload-types'

type Props = {
  aboutData: AboutPage
  thesisData: ThesisPage
  lanesData: LanesPage
  homepageData: Homepage
}

export function AboutClient({
  aboutData: initialAbout,
  thesisData: initialThesis,
  lanesData: initialLanes,
  homepageData: initialHomepage,
}: Props) {
  const { data: about } = useLivePreview<AboutPage>({
    initialData: initialAbout,
    serverURL: getClientSideURL(),
    depth: 1,
  })

  const thesis = initialThesis
  const lanes = initialLanes
  const homepage = initialHomepage

  const visibleColumns = (thesis.columns ?? []).filter((col) => col.visible ?? true)
  const visibleLanes = (lanes.lanes ?? []).filter((lane) => lane.visible ?? true)
  const visibleSpecRows = (homepage.specRows ?? []).filter((row) => row.visible ?? true)

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="bg-background py-16 md:py-24">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h1
                className="font-sans text-4xl font-bold leading-[0.95] text-foreground md:text-6xl lg:text-7xl"
                style={{ letterSpacing: '-0.03em' }}
              >
                {about.heading || 'The brand.'}
              </h1>
              {about.subtext && (
                <p className="mt-6 max-w-lg text-base leading-[1.6] text-foreground/70 md:text-lg">
                  {about.subtext}
                </p>
              )}
            </div>
            {about.heroImage && typeof about.heroImage === 'object' && (() => {
              const { containerClass, imageClass } = getImageDisplayStyles(
                (about as any).heroImageSize,
                (about as any).heroImageAspect,
              )
              return (
                <div className={containerClass}>
                  <Media resource={about.heroImage} imgClassName={imageClass} />
                </div>
              )
            })()}
          </div>
        </div>
      </section>

      {/* ── Brand Philosophy (from thesis global) ── */}
      {(about.showPhilosophy ?? true) && (
        <section className="bg-card py-16 md:py-24 border-t border-border">
          <div className="container">
            {/* Lede */}
            {thesis.lede && (
              <p className="mb-16 max-w-3xl text-base leading-[1.6] text-foreground/80 md:text-lg md:leading-[1.6]">
                {thesis.lede}
              </p>
            )}

            {/* Three Pillars */}
            {visibleColumns.length > 0 && (
              <div className="mb-16 grid gap-12 md:grid-cols-3 md:gap-8">
                {visibleColumns.map((col, index) => {
                  const num = String(index + 1).padStart(2, '0')
                  return (
                    <div key={col.id || index}>
                      <h3 className="mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        <span className="block h-px w-[18px] flex-shrink-0 bg-primary" />
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
          </div>
        </section>
      )}

      {/* ── Editorial Image (between philosophy and lanes) ── */}
      {about.philosophyImage && typeof about.philosophyImage === 'object' && (() => {
        const { containerClass, imageClass } = getImageDisplayStyles(
          (about as any).philosophyImageSize,
          (about as any).philosophyImageAspect,
        )
        return (
          <div className={`mx-auto ${containerClass}`}>
            <Media resource={about.philosophyImage} imgClassName={imageClass} />
          </div>
        )
      })()}

      {/* ── Design Lanes (from lanes global) ── */}
      {(about.showLanes ?? true) && (
        <section className="bg-background py-16 md:py-24 border-t border-border">
          <div className="container">
            <header className="mb-12">
              <h2
                className="font-sans text-3xl font-bold leading-[0.95] text-foreground md:text-5xl"
                style={{ letterSpacing: '-0.03em' }}
              >
                {lanes.heading || 'Five lanes. That\u2019s the catalog.'}
              </h2>
            </header>

            {visibleLanes.length > 0 && (
              <div className="mb-12">
                {visibleLanes.map((lane) => {
                  const num = lane.number.replace('L.', '')
                  return (
                    <div
                      key={lane.id || lane.number}
                      className="group grid gap-4 border-t border-border py-8 transition-all duration-200 hover:bg-card hover:px-6 md:grid-cols-[140px_1fr] md:gap-10 md:py-10"
                    >
                      <div className="flex items-baseline gap-4 md:flex-col md:gap-1">
                        <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                          {lane.number}
                        </span>
                        <span
                          className="font-sans text-[32px] font-bold leading-none text-foreground/10 md:text-[56px]"
                          style={{ letterSpacing: '-0.04em' }}
                        >
                          {num}
                        </span>
                      </div>
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
                <div className="border-t border-border" />
              </div>
            )}

            {/* Negative Box */}
            {(lanes.showNegativeBox ?? true) && (
              <div className="rounded-sm border border-dashed border-border p-8 md:p-10">
                <span className="mb-3 block text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                  {lanes.negativeBoxLabel || 'Not in the catalog'}
                </span>
                <span className="text-[15px] leading-[1.6] text-muted-foreground">
                  {lanes.negativeBoxContent ||
                    'clean minimalism \u00b7 soft / feminine \u00b7 athletic / performance \u00b7 luxury polish \u00b7 kids & family \u00b7 anything that needs the joke explained.'}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Quality & Specs (from homepage global) ── */}
      {(about.showSpecs ?? true) && visibleSpecRows.length > 0 && (
        <section className="bg-card py-16 md:py-24 border-t border-border">
          <div className="container">
            <div className="grid gap-12 md:grid-cols-2 md:gap-16 md:items-start">
              <div>
                <h2
                  className="mb-6 font-sans text-3xl font-bold leading-[0.95] text-foreground md:text-5xl"
                  style={{ letterSpacing: '-0.03em' }}
                >
                  {homepage.specHeading || 'The joke has weight. Literally.'}
                </h2>
                <p className="mb-8 max-w-lg text-base leading-[1.6] text-muted-foreground">
                  {homepage.specSubtext || ''}
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    {visibleSpecRows.map((row, i) => (
                      <tr key={i} className="border-b border-dashed border-border">
                        <td className="py-3 pr-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground w-[38%]">
                          {row.label}
                        </td>
                        <td className="py-3 font-mono text-[13px] text-foreground">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {about.specsImage && typeof about.specsImage === 'object' && (() => {
                const { containerClass, imageClass } = getImageDisplayStyles(
                  (about as any).specsImageSize,
                  (about as any).specsImageAspect,
                )
                return (
                  <div className={containerClass}>
                    <Media resource={about.specsImage} imgClassName={imageClass} />
                  </div>
                )
              })()}
            </div>
          </div>
        </section>
      )}

      {/* ── Rules (from thesis global) ── */}
      {(about.showRules ?? true) && (
        <section className="bg-background py-16 md:py-24 border-t border-border">
          <div className="container">
            <dl>
              <dt className="mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                <span className="block h-px w-[18px] flex-shrink-0 bg-primary" />
                {thesis.rulesTerm || 'What we don\u2019t do'}
              </dt>
              <dd className="max-w-3xl text-sm leading-[1.8] text-muted-foreground">
                {thesis.rulesDefinition ||
                  '\u201cCurated.\u201d Founder selfies. Points programs. Referral wheels. 10%-off-for-your-email popups. Mountain hero shots. Coffee-cup lifestyle. Black Friday in the standard way. Performing Gen\u00a0Z in the copy. Soft pastel anything. Recoloring the logo. Explaining the joke.'}
              </dd>
            </dl>
          </div>
        </section>
      )}
    </div>
  )
}
