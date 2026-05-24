import styles from './spec-section.module.css'
import type { Homepage } from '@/payload-types'

type Props = { data: Homepage }

const DEFAULT_SPEC_ROWS = [
  { label: 'Tee weight', value: '240 GSM · ringspun cotton' },
  { label: 'Hoodie weight', value: '380 GSM · brushed fleece' },
  { label: 'Cut', value: 'Boxy / dropped shoulder' },
  { label: 'Printing', value: 'DTG (direct to garment)' },
  { label: 'Ships from', value: 'Berlin · Riga · Charlotte' },
  { label: 'Returns', value: '30 days, unworn, tags on' },
  { label: 'Care label', value: 'Cold wash · hang dry · iron inside out' },
  { label: 'Editions', value: 'Limited runs · no restocks' },
]

export function SpecSection({ data }: Props) {
  const rows = (data.specRows?.length ? data.specRows : DEFAULT_SPEC_ROWS).filter((r) => ('visible' in r ? (r.visible ?? true) : true))

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <div className={styles.left}>
            <span className={styles.number}>{data.specNumber || 'SEC / 05'}</span>
            <h2 className={styles.heading}>
              {data.specHeading || 'The joke has weight. Literally.'}
            </h2>
            <p className={styles.subtext}>
              {data.specSubtext || 'The line is dry on purpose. The garment is heavy on purpose. If the irony floats, the brand floats with it. So we anchor every product in one concrete number.'}
            </p>
            <table className={styles.table}>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <td className={styles.tdLabel}>{row.label}</td>
                    <td className={styles.tdValue}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.right}>
            <svg viewBox="0 0 500 525" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={styles.illustration}>
              <rect width="500" height="525" fill="#111111" />
              <rect width="500" height="525" fill="url(#specRadial)" opacity="0.4" />
              <defs>
                <radialGradient id="specRadial" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#2A2A2A" />
                  <stop offset="100%" stopColor="#111111" />
                </radialGradient>
              </defs>
              <line x1="20" y1="20" x2="40" y2="20" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.3" />
              <line x1="20" y1="20" x2="20" y2="40" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.3" />
              <line x1="460" y1="20" x2="480" y2="20" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.3" />
              <line x1="480" y1="20" x2="480" y2="40" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.3" />
              <line x1="20" y1="505" x2="40" y2="505" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.3" />
              <line x1="20" y1="485" x2="20" y2="505" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.3" />
              <line x1="460" y1="505" x2="480" y2="505" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.3" />
              <line x1="480" y1="485" x2="480" y2="505" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.3" />
              <g transform="translate(100, 100)">
                <rect x="40" y="60" width="220" height="250" rx="2" fill="#D9D2C2" />
                <rect x="40" y="60" width="50" height="120" rx="1" fill="#C8C0AF" />
                <rect x="210" y="60" width="50" height="120" rx="1" fill="#C8C0AF" />
                <path d="M130,60 Q150,45 170,60" stroke="#111111" strokeWidth="1.5" fill="none" />
                <line x1="40" y1="190" x2="260" y2="190" stroke="#111111" strokeWidth="0.8" opacity="0.4" strokeDasharray="4 3" />
                <rect x="40" y="190" width="220" height="120" rx="1" fill="#C8C0AF" opacity="0.6" />
                <text x="150" y="130" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="#111111" letterSpacing="-0.02em">DRY COPY.</text>
                <text x="150" y="160" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="#5A6242" letterSpacing="-0.02em">LOUD PRINT.</text>
              </g>
              <line x1="300" y1="200" x2="420" y2="140" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.5" />
              <circle cx="300" cy="200" r="2" fill="#5A6242" />
              <text x="425" y="143" fontFamily="monospace" fontSize="10" fill="#F5F2EC" opacity="0.7" letterSpacing="0.08em">240GSM</text>
              <line x1="320" y1="260" x2="420" y2="220" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.5" />
              <circle cx="320" cy="260" r="2" fill="#5A6242" />
              <text x="425" y="223" fontFamily="monospace" fontSize="10" fill="#F5F2EC" opacity="0.7" letterSpacing="0.08em">BOXY</text>
              <line x1="280" y1="340" x2="420" y2="310" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.5" />
              <circle cx="280" cy="340" r="2" fill="#5A6242" />
              <text x="425" y="313" fontFamily="monospace" fontSize="10" fill="#F5F2EC" opacity="0.7" letterSpacing="0.08em">RINGSPUN</text>
              <line x1="240" y1="270" x2="420" y2="380" stroke="#F5F2EC" strokeWidth="0.5" opacity="0.5" />
              <circle cx="240" cy="270" r="2" fill="#5A6242" />
              <text x="425" y="383" fontFamily="monospace" fontSize="10" fill="#F5F2EC" opacity="0.7" letterSpacing="0.08em">DTG PRINT</text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
