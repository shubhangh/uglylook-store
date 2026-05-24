import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { SizeGuidePage } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Size Guide — UglyLook',
  description: 'Sizing charts and fit guide for UglyLook apparel.',
}

function toCm(inches: string): string {
  return (parseFloat(inches) * 2.54).toFixed(1)
}

function SizeTable({
  title,
  sizes,
}: {
  title: string
  sizes: { size: string; chest: string; length: string; sleeve: string; id?: string | null }[]
}) {
  return (
    <div>
      <h2 className="font-mono text-[10px] uppercase tracking-widest text-olive-text mb-6 flex items-center gap-2.5">
        <span className="w-[18px] h-px bg-olive inline-block" />
        {title}
      </h2>
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground p-4">
                Size
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground p-4">
                Chest
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground p-4">
                Length
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground p-4">
                Sleeve
              </th>
            </tr>
          </thead>
          <tbody className="text-foreground/80">
            {sizes.map((row) => (
              <tr key={row.id || row.size} className="border-b border-border last:border-0">
                <td className="p-4 font-medium">{row.size}</td>
                <td className="p-4 font-mono text-xs">
                  {row.chest}&Prime; <span className="text-muted-foreground">/ {toCm(row.chest)} cm</span>
                </td>
                <td className="p-4 font-mono text-xs">
                  {row.length}&Prime; <span className="text-muted-foreground">/ {toCm(row.length)} cm</span>
                </td>
                <td className="p-4 font-mono text-xs">
                  {row.sleeve}&Prime; <span className="text-muted-foreground">/ {toCm(row.sleeve)} cm</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function SizeGuidePage() {
  const data = await getCachedGlobal('sizeGuidePage', 1)() as SizeGuidePage

  const visibleTables = (data.sizeTables ?? []).filter((t) => t.visible ?? true)

  return (
    <section className="min-h-screen bg-background py-16 md:py-24">
      <div className="container max-w-3xl">
        {/* Section Header */}
        <header className="mb-16 md:mb-24">
          <span className="font-mono text-[11px] tracking-widest text-olive-text uppercase">
            {data.sectionLabel || 'INFO / 02'}
          </span>
          <h1
            className="mt-4 font-sans text-4xl font-bold leading-[0.95] text-foreground md:text-6xl lg:text-7xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            {data.heading || 'Size Guide.'}
          </h1>
          <p className="mt-6 text-base text-foreground/70 max-w-lg">
            {data.subtext || 'Boxy fit. Relaxed shoulders. If you\u2019re between sizes, size down. These run generous on purpose.'}
          </p>
        </header>

        <div className="space-y-16">
          {visibleTables.map((table) => (
            <SizeTable
              key={table.id || table.title}
              title={table.title}
              sizes={table.rows ?? []}
            />
          ))}

          {/* How to measure */}
          {(data.show_howToMeasure ?? true) && (
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-olive-text mb-6 flex items-center gap-2.5">
                <span className="w-[18px] h-px bg-olive inline-block" />
                {data.measureTitle || 'How to measure'}
              </h2>
              <div className="space-y-6 text-base leading-[1.7] text-foreground/70">
                <div>
                  <p className="font-medium text-foreground mb-1">Chest</p>
                  <p>{data.measureChest || 'Measure across the chest, 1 inch below the armhole, from edge to edge. Double it.'}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Length</p>
                  <p>{data.measureLength || 'From the highest point of the shoulder to the bottom hem.'}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Sleeve</p>
                  <p>
                    {data.measureSleeve || 'Tees: from shoulder seam to sleeve hem. Hoodies: from center back neck, across the shoulder, down to the cuff.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fit note */}
          {(data.show_fitNote ?? true) && (
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-olive-text mb-3">
                {data.fitNoteLabel || 'Fit note'}
              </p>
              <p className="text-sm leading-relaxed text-foreground/70">
                {data.fitNoteContent || 'All garments are pre-shrunk. Cold wash, hang dry, and they\u2019ll hold their shape. Hot wash at your own risk \u2014 we warned you.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
