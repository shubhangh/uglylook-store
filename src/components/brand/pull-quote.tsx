import styles from './pull-quote.module.css'
import type { Homepage } from '@/payload-types'

type Props = { data: Homepage }

export function PullQuote({ data }: Props) {
  const text = data.pullQuoteText || 'Coolness is always the inversion of an insult.'
  const emWord = data.pullQuoteEmWord || 'inversion'
  const parts = text.split(emWord)

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <span className={styles.meta}>{data.pullQuoteMetaLeft || 'FN.01'}</span>
          <p className={styles.quote}>
            {parts[0]}<em className={styles.em}>{emWord}</em>{parts.slice(1).join(emWord)}
          </p>
          <span className={styles.meta}>{data.pullQuoteMetaRight || 'UL · SS27'}</span>
        </div>
      </div>
    </section>
  )
}
