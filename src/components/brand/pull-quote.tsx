import styles from './pull-quote.module.css'
import Link from 'next/link'
import type { Homepage } from '@/payload-types'

type Props = { data: Homepage }

export function PullQuote({ data }: Props) {
  const text = data.pullQuoteText || 'Coolness is always the inversion of an insult.'
  const emWord = data.pullQuoteEmWord || 'inversion'
  const parts = text.split(emWord)

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <p className={styles.quote}>
          {parts[0]}<em className={styles.em}>{emWord}</em>{parts.slice(1).join(emWord)}
        </p>
        <Link href="/about" className={styles.link}>
          Our story &rarr;
        </Link>
      </div>
    </section>
  )
}
