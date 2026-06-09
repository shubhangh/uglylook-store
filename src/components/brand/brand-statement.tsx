import styles from './brand-statement.module.css'
import type { Homepage } from '@/payload-types'

type Props = { data: Homepage }

export function BrandStatement({ data }: Props) {
  const d = data as any
  if (d.showBrandStatement === false) return null

  const lede = d.brandLede || 'Every generation invents new slang for \u201cgood.\u201d Every word started its life meaning bad. We\u2019re just the first ones putting it on the chest.'
  const emWord = d.brandEmWord || 'bad'
  const specs: { text: string }[] = d.brandSpecs || [
    { text: '240gsm cotton' },
    { text: 'Boxy fit' },
    { text: 'Printed when you order' },
  ]
  const watermark = d.brandWatermark || 'UGLY'
  const stamp1 = d.brandStamp1 || 'NOT FOR EVERYONE'
  const stamp2 = d.brandStamp2 || 'FILTER: AGGRESSIVE'

  const parts = lede.split(emWord)

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.inner}>
          {/* Oversized decorative text */}
          {watermark && (
            <span className={styles.watermark} aria-hidden="true">{watermark}</span>
          )}

          <div className={styles.content}>
            <p className={styles.lede}>
              {parts[0]}<em className={styles.em}>{emWord}</em>{parts.slice(1).join(emWord)}
            </p>

            {specs.length > 0 && (
              <div className={styles.specs}>
                {specs.map((spec, i) => (
                  <span key={i}>
                    <span className={styles.specItem}>{spec.text}</span>
                    {i < specs.length - 1 && <span className={styles.specDot} aria-hidden="true">&middot;</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.stamps} aria-hidden="true">
            {stamp1 && (
              <span className={styles.stamp1}>{stamp1.split(' ').map((w: string, i: number) => <span key={i}>{w}<br /></span>)}</span>
            )}
            {stamp2 && (
              <span className={styles.stamp2}>{stamp2.split(' ').map((w: string, i: number) => <span key={i}>{w}<br /></span>)}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
