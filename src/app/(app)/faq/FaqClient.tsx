'use client'

import { useState } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { getClientSideURL } from '@/utilities/getURL'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import type { FaqPage } from '@/payload-types'

export function FaqClient({ data: initialData }: { data: FaqPage }) {
  const { data } = useLivePreview<FaqPage>({
    initialData,
    serverURL: getClientSideURL(),
    depth: 1,
  })
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const visibleCategories = (data.categories ?? []).filter((cat) => cat.visible ?? true)

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const el = document.getElementById(`faq-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="min-h-screen bg-background py-16 md:py-24">
      <div className="container">
        {/* Section Header */}
        <header className="mb-16 md:mb-24 max-w-3xl">
          <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            {data.sectionLabel || 'INFO / 03'}
          </span>
          <h1
            className="mt-4 font-sans text-4xl font-bold leading-[0.95] text-foreground md:text-6xl lg:text-7xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            {(data.heading || 'FAQ.\nFine, we\u2019ll explain.').split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h1>
        </header>

        <div className="flex flex-col md:flex-row gap-12 md:gap-16">
          {/* Sticky sidebar nav */}
          <nav className="md:w-48 flex-shrink-0">
            <div className="md:sticky md:top-24">
              <ul className="flex flex-row md:flex-col gap-2 md:gap-1 flex-wrap">
                {visibleCategories.map((section) => {
                  const sectionId = section.name.toLowerCase().replace(/\s+/g, '-')
                  return (
                    <li key={section.id || sectionId}>
                      <button
                        onClick={() => scrollToSection(sectionId)}
                        className={`text-left text-sm py-1.5 px-3 md:px-0 rounded md:rounded-none transition-colors whitespace-nowrap ${
                          activeSection === sectionId
                            ? 'text-foreground font-medium md:text-olive-text'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {section.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>

          {/* FAQ content */}
          <div className="flex-1 max-w-2xl space-y-12">
            {visibleCategories.map((section) => {
              const sectionId = section.name.toLowerCase().replace(/\s+/g, '-')
              const visibleQuestions = (section.questions ?? []).filter((q) => q.visible ?? true)
              return (
                <div key={section.id || sectionId} id={`faq-${sectionId}`} className="scroll-mt-24">
                  <h2 className="text-[10px] font-medium uppercase tracking-widest text-olive-text mb-4 flex items-center gap-2.5">
                    <span className="w-[18px] h-px bg-olive inline-block" />
                    {section.name}
                  </h2>
                  <Accordion type="multiple">
                    {visibleQuestions.map((item, i) => (
                      <AccordionItem key={item.id || i} value={`${sectionId}-${i}`} className="border-border">
                        <AccordionTrigger className="text-base font-medium text-foreground hover:text-foreground hover:no-underline py-5">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-relaxed text-foreground/70 pr-8">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )
            })}
          </div>
        </div>

        {(data.showFooterCta ?? true) && (
          <div className="mt-16 bg-card rounded-lg border border-border p-6 max-w-2xl md:ml-[calc(12rem+4rem)]">
            <p className="text-sm text-foreground/70">
              {data.footerCtaText || "Still have questions?"}{' '}
              <a
                href="/contact"
                className="text-olive-text underline underline-offset-4 hover:text-foreground transition-colors"
              >
                Get in touch
              </a>
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
