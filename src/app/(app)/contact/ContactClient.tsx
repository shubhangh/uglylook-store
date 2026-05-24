'use client'

import { useState } from 'react'
import type { ContactPage } from '@/payload-types'

export default function ContactClient({ data }: { data: ContactPage }) {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="min-h-screen bg-card py-16 md:py-24">
      <div className="container">
        {/* Section Header */}
        <header className="mb-16 md:mb-24">
          <span className="font-mono text-[11px] tracking-widest text-olive-text uppercase">
            {data.sectionNumber || 'SEC / 07'}
          </span>
          <h1
            className="mt-4 font-sans text-4xl font-bold leading-[0.95] text-foreground md:text-6xl lg:text-7xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            {(data.heading || 'Contact.\nIf you must.').split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h1>
        </header>

        <div className="grid gap-16 md:grid-cols-[1fr_1.5fr] md:gap-20">
          {/* Left: Info */}
          {(data.showInfoColumn ?? true) && (
            <div>
              <p className="mb-8 text-base leading-[1.6] text-foreground/70">
                {data.infoParagraph || 'We read everything. We reply when there\u2019s something to say. No templates. No auto-responses. Just a person, eventually.'}
              </p>

              <a
                href={`mailto:${data.email || 'hello@uglylook.com'}`}
                className="mb-8 inline-block font-mono text-base text-olive-text underline underline-offset-4 transition-colors hover:text-foreground"
              >
                {data.email || 'hello@uglylook.com'}
              </a>

              {(data.showInfoBox ?? true) && (
                <div className="mt-8 border-t border-border pt-8">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground leading-[1.8]">
                    {data.infoBoxLine1 || 'No live chat. No chatbot.'}<br />
                    {data.infoBoxLine2 || 'No \u201chow can I help you today\u201d energy.'}<br />
                    {data.infoBoxLine3 || 'No ticket number. No SLA.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Right: Form or Success */}
          {submitted ? (
            <div className="flex items-center">
              <div>
                <span className="font-mono text-[11px] tracking-widest text-olive-text uppercase block mb-4">
                  {data.successLabel || 'SENT'}
                </span>
                <h2
                  className="font-sans text-3xl font-bold leading-[0.95] text-foreground md:text-4xl mb-4"
                  style={{ letterSpacing: '-0.03em' }}
                >
                  {data.successHeading || 'Got it.'}
                </h2>
                <p className="text-base text-foreground/70">
                  {data.successMessage || 'We\u2019ll read it eventually. If it needs a reply, you\u2019ll get one.'}
                </p>
              </div>
            </div>
          ) : (data.showForm ?? true) ? (
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-none border-0 border-b border-input bg-transparent px-0 py-3 font-sans text-base text-foreground placeholder:text-muted-foreground/50 focus:border-olive focus:outline-none transition-colors"
                  placeholder={data.namePlaceholder || 'your name'}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-none border-0 border-b border-input bg-transparent px-0 py-3 font-sans text-base text-foreground placeholder:text-muted-foreground/50 focus:border-olive focus:outline-none transition-colors"
                  placeholder={data.emailPlaceholder || 'you@somewhere.com'}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  Subject
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  className="w-full rounded-none border-0 border-b border-input bg-transparent px-0 py-3 font-sans text-base text-foreground placeholder:text-muted-foreground/50 focus:border-olive focus:outline-none transition-colors"
                  placeholder={data.subjectPlaceholder || 'optional'}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  className="w-full resize-none rounded-none border-0 border-b border-input bg-transparent px-0 py-3 font-sans text-base text-foreground placeholder:text-muted-foreground/50 focus:border-olive focus:outline-none transition-colors"
                  placeholder={data.messagePlaceholder || 'keep it short or don\'t. we\'ll read it either way.'}
                />
              </div>

              <button
                type="submit"
                className="rounded-[4px] bg-olive px-8 py-3 font-mono text-[11px] uppercase tracking-widest text-cream transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-olive focus:ring-offset-2 focus:ring-offset-background"
              >
                {data.submitText || 'Send'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  )
}
