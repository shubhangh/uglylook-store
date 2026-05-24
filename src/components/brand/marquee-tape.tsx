'use client'

import styles from './marquee-tape.module.css'
import type { Homepage } from '@/payload-types'

type Props = { data: Homepage }

const DEFAULT_WORDS: { word: string; highlight?: boolean | null }[] = [
  { word: 'Sick', highlight: false },
  { word: 'Wicked', highlight: false },
  { word: 'Bad', highlight: false },
  { word: 'Killer', highlight: false },
  { word: 'Dope', highlight: false },
  { word: 'Filthy', highlight: false },
  { word: 'Nasty', highlight: false },
  { word: 'Gnarly', highlight: false },
  { word: 'Ugly', highlight: true },
]

function TapeContent({ words, separator }: { words: typeof DEFAULT_WORDS; separator: string }) {
  return (
    <>
      {words.map((item) => (
        <span key={item.word} className={styles.wordGroup}>
          {item.highlight ? (
            <span className={styles.wordHighlight}>{item.word}</span>
          ) : (
            <span className={styles.word}>{item.word}</span>
          )}
          <span className={styles.separator} aria-hidden="true">{separator}</span>
        </span>
      ))}
    </>
  )
}

export function MarqueeTape({ data }: Props) {
  const words = data.marqueeWords?.length ? data.marqueeWords : DEFAULT_WORDS
  const separator = data.marqueeSeparator || '✕'

  return (
    <div className={styles.tape} aria-label="Brand words marquee" role="marquee">
      <div className={styles.track}>
        <div className={styles.content}>
          <TapeContent words={words} separator={separator} />
          <TapeContent words={words} separator={separator} />
        </div>
      </div>
    </div>
  )
}
