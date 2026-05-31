import styles from './hero-section.module.css'
import Link from 'next/link'
import type { Homepage } from '@/payload-types'

type Props = { data: Homepage }

export function HeroSection({ data }: Props) {
  const line1 = data.heroLine1 || 'Good is over.'
  const line1Words = line1.split(' ')
  const strikeWord = line1Words[0]
  const restOfLine1 = line1Words.slice(1).join(' ')

  const tagRows = (data.heroTagRows || []).filter((r) => (r.visible ?? true))

  return (
    <section className={styles.hero}>
      <div className={styles.wrap}>
        {(data.heroStamp || data.heroClock || data.heroFileLabel) && (
          <div className={styles.strip}>
            {data.heroStamp && (
              <span className={styles.stamp}>
                <span className={styles.dot} />
                {data.heroStamp}
              </span>
            )}
            <span />
            {data.heroClock && <span className={styles.clock}>{data.heroClock}</span>}
            {data.heroFileLabel && <span className={styles.file}>{data.heroFileLabel}</span>}
          </div>
        )}

        <h1 className={styles.headline}>
          <span className={styles.line1}>
            <span className={styles.strike}>{strikeWord}</span> {restOfLine1}
          </span>
          <span className={styles.line2}>{data.heroLine2 || 'Ugly is the new'}</span>
          <span className={styles.line3}>
            <span className={styles.invert}>{data.heroLine3 || 'sick.'}</span>
          </span>
        </h1>

        <div className={styles.row}>
          <div className={styles.left}>
            <p className={styles.subtitle}>
              {data.heroSubtitle || "Tees, hoodies and objects too loud for the For You page. 240gsm cotton, boxy fit, dry copy, printed when you order. None of it is for the people who'll call it ugly. All of it is for the people who'll call it ugly and mean it."}
            </p>

            <div className={styles.actions}>
              <Link href={data.heroCta1Url || '/shop'} className={styles.btnPrimary}>
                {data.heroCta1Text || 'See the catalog'}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ marginLeft: 6 }}>
                  <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href={data.heroCta2Url || '#manifesto'} className={styles.btnSecondary}>
                {data.heroCta2Text || 'Read the thesis'}
              </Link>
              <small className={styles.note}>{data.heroNote || 'no email required · no popup · ever.'}</small>
            </div>
          </div>

          {(data.showTagCard ?? true) && (
          <div className={styles.right}>
            <dl className={styles.tagCard}>
              {tagRows.map((row) => (
                <div key={row.id || row.label} className={styles.tagRow}>
                  <dt className={styles.tagLabel}>{row.label}</dt>
                  <dd className={row.highlight ? `${styles.tagValue} ${styles.tagHighlight}` : styles.tagValue}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          )}
        </div>
      </div>
    </section>
  )
}
