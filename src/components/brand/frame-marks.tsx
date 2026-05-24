import styles from './frame-marks.module.css'

export function FrameMarks() {
  return (
    <>
      <div className={`${styles.mark} ${styles.tl}`} aria-hidden="true" />
      <div className={`${styles.mark} ${styles.tr}`} aria-hidden="true" />
      <div className={`${styles.mark} ${styles.bl}`} aria-hidden="true" />
      <div className={`${styles.mark} ${styles.br}`} aria-hidden="true" />
    </>
  )
}
