'use client'

import { useState, useEffect } from 'react'
import styles from './drop-section.module.css'
import type { Homepage } from '@/payload-types'

type Props = { data: Homepage }

const DEFAULT_TARGET_DATE = '2027-01-14T14:00:00Z'

interface TimeLeft { days: number; hours: number; min: number; sec: number }

function calcTimeLeft(targetDate: string): TimeLeft {
  const diff = Math.max(0, new Date(targetDate).getTime() - Date.now())
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    min: Math.floor((diff / (1000 * 60)) % 60),
    sec: Math.floor((diff / 1000) % 60),
  }
}

function pad(n: number): string { return String(n).padStart(2, '0') }

export function DropSection({ data }: Props) {
  const targetDate = data.dropTargetDate || DEFAULT_TARGET_DATE
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, min: 0, sec: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTime(calcTimeLeft(targetDate))
    const id = setInterval(() => setTime(calcTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const cells = [
    { value: time.days, label: 'Days' },
    { value: time.hours, label: 'Hours' },
    { value: time.min, label: 'Min' },
    { value: time.sec, label: 'Sec' },
  ]

  return (
    <section id="drop" className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <div className={styles.left}>
            <p className={styles.label}>
              {data.dropLabel || 'SEC / 06 \u00B7 Next drop \u00B7 we\u2019re not counting because urgency is for amateurs but here\u2019s the number anyway.'}
            </p>
            <h2 className={styles.heading}>{data.dropHeading || 'SS27 / 01 \u2014 opens when it opens.'}</h2>
          </div>
          <div className={styles.clock} aria-label="Time until next drop" role="timer">
            {cells.map((cell) => (
              <div key={cell.label} className={styles.cell}>
                <span className={styles.cellNumber}>
                  {mounted ? (cell.label === 'Days' ? cell.value : pad(cell.value)) : '00'}
                </span>
                <span className={styles.cellLabel}>{cell.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
