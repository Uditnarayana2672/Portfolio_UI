import styles from './Toggle.module.css'

interface ToggleProps {
  label: string
  subLabel?: string
  checked: boolean
  onChange: (v: boolean) => void
}

export default function Toggle({ label, subLabel, checked, onChange }: ToggleProps) {
  return (
    <div className={styles.toggleRow}>
      <div>
        <div className={styles.lblText}>{label}</div>
        {subLabel && <div className={styles.lblSub}>{subLabel}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`${styles.tgl} ${checked ? styles.tglOn : ''}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`${styles.tglKnob} ${checked ? styles.tglKnobOn : ''}`} />
      </button>
    </div>
  )
}
