import { useContext, useState } from 'react'
import { ErrorsContext, moved, removed, replaced } from './portfolioHelpers'
import styles from './PortfolioInfo.module.css'

export function FieldError({ path }: { path: string }) {
  const message = useContext(ErrorsContext)[path]
  return message ? <span className={styles.fieldError} role="alert">{message}</span> : null
}

export function TextField({ label, path, value, onChange, maxLength = 200, placeholder, hint }: {
  label: string
  path: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  placeholder?: string
  hint?: string
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input value={value} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className={styles.hint}>{hint}</span>}
      <FieldError path={path} />
    </label>
  )
}

export function TextArea({ label, path, value, onChange, maxLength = 600, rows = 3, hint }: {
  label: string
  path: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  rows?: number
  hint?: string
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <textarea value={value} maxLength={maxLength} rows={rows} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className={styles.hint}>{hint}</span>}
      <FieldError path={path} />
    </label>
  )
}

/** Move up, move down and remove buttons for one row of a list. */
export function RowActions({ index, count, name, onMove, onRemove }: {
  index: number
  count: number
  name: string
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className={styles.rowActions}>
      <button type="button" disabled={index === 0} aria-label={`Move ${name} up`} onClick={() => onMove(index, index - 1)}>↑</button>
      <button type="button" disabled={index === count - 1} aria-label={`Move ${name} down`} onClick={() => onMove(index, index + 1)}>↓</button>
      <button type="button" className={styles.remove} aria-label={`Remove ${name}`} onClick={() => onRemove(index)}>✕</button>
    </div>
  )
}

/** A short list of plain strings, one input per row. */
export function StringList({ label, path, values, max, addLabel, onChange }: {
  label: string
  path: string
  values: string[]
  max: number
  addLabel: string
  onChange: (values: string[]) => void
}) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {values.map((value, i) => (
        <div key={i} className={styles.stringRow}>
          <div className={styles.grow}>
            <input
              aria-label={`${label} ${i + 1}`}
              value={value}
              maxLength={200}
              onChange={(e) => onChange(replaced(values, i, e.target.value))}
            />
            <FieldError path={`${path}[${i}]`} />
          </div>
          <RowActions
            index={i}
            count={values.length}
            name={`${label} ${i + 1}`}
            onMove={(from, to) => onChange(moved(values, from, to))}
            onRemove={(index) => onChange(removed(values, index))}
          />
        </div>
      ))}
      <FieldError path={path} />
      <button type="button" className={styles.add} disabled={values.length >= max} onClick={() => onChange([...values, ''])}>
        + {addLabel}
      </button>
    </div>
  )
}

/** Logo from simpleicons in black and white, falling back to a letter badge. */
export function TechLogo({ name, slug }: { name: string; slug: string | null }) {
  const [failedSlug, setFailedSlug] = useState<string | null>(null)
  if (!slug || failedSlug === slug) {
    return <span className={styles.badge} aria-hidden="true">{name.trim().slice(0, 2) || '?'}</span>
  }
  return (
    <img
      className={styles.logo}
      src={`https://cdn.simpleicons.org/${encodeURIComponent(slug)}/21201c`}
      alt=""
      onError={() => setFailedSlug(slug)}
    />
  )
}
