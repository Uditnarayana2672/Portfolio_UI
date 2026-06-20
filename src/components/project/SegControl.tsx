import styles from './SegControl.module.css'

export interface SegOption {
  value: string
  label: string
}

interface SegControlProps {
  options: SegOption[]
  value: string
  onChange: (v: string) => void
}

export default function SegControl({ options, value, onChange }: SegControlProps) {
  return (
    <div className={styles.seg}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={opt.value === value ? `${styles.btn} ${styles.btnOn}` : styles.btn}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
