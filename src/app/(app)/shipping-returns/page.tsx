import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { ShippingReturnsPage } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Shipping & Returns — UglyLook',
  description: 'Shipping info, return policy, and international fulfillment details.',
}

export default async function ShippingReturnsPage() {
  const data = await getCachedGlobal('shippingReturnsPage', 1)() as ShippingReturnsPage

  const visibleShippingRows = (data.shippingRows ?? []).filter((row) => row.visible ?? true)
  const visibleNoReturnsList = (data.noReturnsList ?? []).filter((item) => item.visible ?? true)

  return (
    <section className="min-h-screen bg-background py-16 md:py-24">
      <div className="container max-w-3xl">
        {/* Section Header */}
        <header className="mb-16 md:mb-24">
          <span className="font-mono text-[11px] tracking-widest text-olive-text uppercase">
            {data.sectionLabel || 'INFO / 01'}
          </span>
          <h1
            className="mt-4 font-sans text-4xl font-bold leading-[0.95] text-foreground md:text-6xl lg:text-7xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            {(data.heading || 'Shipping &\nReturns.').split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h1>
        </header>

        <div className="space-y-16">
          {/* Fulfillment */}
          {(data.show_howItWorks ?? true) && (
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-olive-text mb-6 flex items-center gap-2.5">
                <span className="w-[18px] h-px bg-olive inline-block" />
                {data.howItWorks_title || 'How it works'}
              </h2>
              <div className="space-y-4 text-base leading-[1.7] text-foreground/70">
                {(data.howItWorks_content || 'Every piece is print-on-demand. Nothing sits in a warehouse. When you order, your item gets printed, pressed, and packed \u2014 then shipped directly to you.\nFulfillment partners: Printful (US, EU) and Gelato (global). Facilities in Charlotte, Berlin, and Riga \u2014 your order ships from the nearest hub.').split('\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          )}

          {/* Shipping */}
          {(data.show_shippingTable ?? true) && (
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-olive-text mb-6 flex items-center gap-2.5">
                <span className="w-[18px] h-px bg-olive inline-block" />
                {data.shippingTableTitle || 'Shipping times'}
              </h2>
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground p-4">
                        Region
                      </th>
                      <th className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground p-4">
                        Production
                      </th>
                      <th className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground p-4">
                        Transit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground/80">
                    {visibleShippingRows.map((row, i) => (
                      <tr key={row.id || i} className={i < visibleShippingRows.length - 1 ? 'border-b border-border' : ''}>
                        <td className="p-4">{row.region}</td>
                        <td className="p-4 font-mono text-xs">{row.production}</td>
                        <td className="p-4 font-mono text-xs">{row.transit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 font-mono text-[11px] text-muted-foreground leading-relaxed">
                {data.shippingTableNote || 'Total delivery: 5\u201310 business days for most orders. Customs delays are on customs.'}
              </p>
            </div>
          )}

          {/* Returns */}
          {(data.show_returns ?? true) && (
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-olive-text mb-6 flex items-center gap-2.5">
                <span className="w-[18px] h-px bg-olive inline-block" />
                {data.returns_title || 'Returns'}
              </h2>
              <div className="space-y-4 text-base leading-[1.7] text-foreground/70">
                {(data.returns_content || '30-day return window. Unworn, unwashed, tags still on. That\u2019s it.\nEmail hello@uglylook.com with your order number and reason. We\u2019ll send a return label within 48 hours.\nRefunds hit your original payment method within 5\u201310 business days after we receive the item. No restocking fees. No store credit games.').split('\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          )}

          {/* Exceptions */}
          {(data.show_noReturns ?? true) && (
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-olive-text mb-6 flex items-center gap-2.5">
                <span className="w-[18px] h-px bg-olive inline-block" />
                {data.noReturnsTitle || 'What we don\u2019t take back'}
              </h2>
              <ul className="space-y-2 text-base leading-[1.7] text-foreground/70">
                {visibleNoReturnsList.map((item, i) => (
                  <li key={item.id || i} className="flex items-start gap-3">
                    <span className="w-1 h-1 rounded-full bg-olive mt-3 flex-shrink-0" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Damaged */}
          {(data.show_damaged ?? true) && (
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-olive-text mb-6 flex items-center gap-2.5">
                <span className="w-[18px] h-px bg-olive inline-block" />
                {data.damaged_title || 'Damaged or wrong item'}
              </h2>
              <p className="text-base leading-[1.7] text-foreground/70">
                {data.damaged_content || 'If it arrived damaged or we sent the wrong thing \u2014 email us with photos. We\u2019ll replace it or refund it. No argument.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
