import type { ReactNode } from 'react'
import styles from './TextField.module.css'

interface TextFieldProps {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  error?: string
  placeholder?: string
  multiline?: boolean
  rows?: number
  note?: ReactNode
  disabled?: boolean
  id?: string
  className?: string
}

export default function TextField({
  label, hint, value, onChange, onBlur, error,
  placeholder, multiline = false, rows = 3,
  note, disabled = false, id, className,
}: TextFieldProps) {
  const rootClass = [styles.fg, className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <label className={styles.fl} htmlFor={id}>
        {label}
        {hint && <span className={styles.hint}>{hint}</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          className={`${styles.fi} ${error ? styles.fiError : ''}`}
          value={value}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      ) : (
        <input
          id={id}
          type="text"
          className={`${styles.fi} ${error ? styles.fiError : ''}`}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      )}
      {error ? (
        <span className={styles.fieldError}>{error}</span>
      ) : note ? (
        <div className={styles.fieldNote}>{note}</div>
      ) : null}
    </div>
  )
}
