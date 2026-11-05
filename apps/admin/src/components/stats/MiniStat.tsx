import styles from './MiniStat.module.css'

type Props = {
  label: string
  num: string | number
  numCaption?: string     // e.g. "/ 2.25 GB" rendered small beside the number
  sub?: string
  subVariant?: 'up' | 'warn'
  variant?: 'dark' | 'storage'
  storagePercent?: number // 0-100, controls bar-fill width
}

export default function MiniStat({ label, num, numCaption, sub, subVariant, variant, storagePercent = 0 }: Props) {
  const cardClass = [styles.ministat, variant === 'dark' ? styles.dark : ''].filter(Boolean).join(' ')
  const subClass  = [styles.sub, subVariant ? styles[subVariant] : ''].filter(Boolean).join(' ')

  return (
    <div className={cardClass}>
      <div className={styles.label}>{label}</div>
      <div className={styles.num}>
        {num}
        {numCaption && <span className={styles.numCaption}>{numCaption}</span>}
      </div>
      {sub && <div className={subClass}>{sub}</div>}
      {variant === 'storage' && (
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${storagePercent}%` }} />
          <div className={styles.barMarker} />
        </div>
      )}
    </div>
  )
}
