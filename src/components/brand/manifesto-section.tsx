import styles from './manifesto-section.module.css'
import type { Homepage } from '@/payload-types'

type Props = { data: Homepage }

export function ManifestoSection({ data }: Props) {
  const columns = (data.manifestoColumns || []).filter((c) => (c.visible ?? true))
  const titleParts = (data.manifestoTitle || 'The thesis.\nIn writing.').split('\n')

  return (
    <section id="manifesto" className={styles.section}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.number}>{data.manifestoNumber || 'SEC / 03'}</span>
          <h2 className={styles.title}>{titleParts.map((part, i) => (
            <span key={i}>{part}{i < titleParts.length - 1 && <br />}</span>
          ))}</h2>
        </header>

        <p className={styles.lede}>
          {data.manifestoLede || 'Every generation inverts new slang for \u201Cgood,\u201D and every word started its life meaning bad. We\u2019re just the first ones putting it on the chest.'}
        </p>

        <div className={styles.columns}>
          {columns.map((col) => (
            <div key={col.id || col.heading} className={styles.column}>
              <h3 className={styles.colHeading}>{col.heading}</h3>
              <div className={styles.colBody}>
                <p>{col.paragraph1}</p>
                {col.paragraph2 && <p>{col.paragraph2}</p>}
              </div>
            </div>
          ))}
        </div>

        {(data.showRules ?? true) && (
        <dl className={styles.rules}>
          <dt className={styles.rulesTerm}>{data.rulesTerm || 'What we don\u2019t do'}</dt>
          <dd className={styles.rulesDefinition}>
            {data.rulesDefinition || '\u201CCurated.\u201D Founder selfies. Points programs. Referral wheels. 10%-off-for-your-email popups. Mountain hero shots. Coffee-cup lifestyle. Black Friday in the standard way. Performing Gen\u00A0Z in the copy. Soft pastel anything. Recoloring the logo. Explaining the joke.'}
          </dd>
        </dl>
        )}
      </div>
    </section>
  )
}
