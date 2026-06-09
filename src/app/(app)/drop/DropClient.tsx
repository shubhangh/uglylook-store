'use client'

import { useState, useEffect } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { getClientSideURL } from '@/utilities/getURL'
import type { DropPage } from '@/payload-types'

interface TimeLeft {
  days: number
  hours: number
  min: number
  sec: number
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

const INITIAL_TIME: TimeLeft = { days: 0, hours: 0, min: 0, sec: 0 }

export function DropClient({ data: initialData }: { data: DropPage }) {
  const { data } = useLivePreview<DropPage>({
    initialData,
    serverURL: getClientSideURL(),
    depth: 1,
  })

  const targetDate = data.targetDate || '2027-01-14T14:00:00Z'

  function calcTimeLeft(): TimeLeft {
    const diff = Math.max(0, new Date(targetDate).getTime() - Date.now())
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      min: Math.floor((diff / (1000 * 60)) % 60),
      sec: Math.floor((diff / 1000) % 60),
    }
  }

  const [time, setTime] = useState<TimeLeft>(INITIAL_TIME)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTime(calcTimeLeft())
    const id = setInterval(() => setTime(calcTimeLeft()), 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cells: { value: number; label: string }[] = [
    { value: time.days, label: 'Days' },
    { value: time.hours, label: 'Hours' },
    { value: time.min, label: 'Min' },
    { value: time.sec, label: 'Sec' },
  ]

  return (
    <section className="min-h-screen bg-card py-16 md:py-24">
      <div className="container">
        {/* ── Section Header ── */}
        {(data.showHeader ?? true) && (
          <header className="mb-16 md:mb-24">
            <span className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
              {data.sectionNumber || 'SEC / 06'}
            </span>
            <h1
              className="mt-4 font-sans text-4xl font-bold leading-[0.95] text-foreground md:text-6xl lg:text-7xl"
              style={{ letterSpacing: '-0.03em' }}
            >
              {(data.heading || 'SS27 / 01 \u2014\nopens when it opens.').split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="mt-4 font-mono text-xs tracking-wide text-muted-foreground">
              {data.subheading || 'We\u2019re not counting because urgency is for amateurs \u00b7 but here\u2019s the number anyway'}
            </p>
          </header>
        )}

        {/* ── Countdown ── */}
        {(data.showCountdown ?? true) && (
          <div
            className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
            aria-label="Time until next drop"
            role="timer"
          >
            {cells.map((cell) => (
              <div
                key={cell.label}
                className="flex flex-col items-center rounded-[4px] border border-input bg-background px-4 py-8 md:px-6 md:py-12"
              >
                <span className="font-mono text-[28px] font-bold leading-none text-foreground md:text-5xl lg:text-6xl">
                  {mounted
                    ? cell.label === 'Days'
                      ? cell.value
                      : pad(cell.value)
                    : '00'}
                </span>
                <span className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  {cell.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer note ── */}
        {(data.showFooterNote ?? true) && (
          <p className="mt-12 text-center font-mono text-xs text-muted-foreground">
            {data.footerNote || 'No early access. No waitlist. No \u201cnotify me.\u201d'}
          </p>
        )}
      </div>
    </section>
  )
}
