import { useState, useRef } from 'react'
import styles from './ChipInput.module.css'

interface ChipInputProps {
  label: string
  hint?: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  className?: string
}

export default function ChipInput({
  label, hint, items, onChange, placeholder = '+ add…', className,
}: ChipInputProps) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function commit() {
    const v = draft.trim()
    if (v && !items.includes(v)) onChange([...items, v])
    setDraft('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && items.length > 0) {
      onChange(items.slice(0, -1))
    }
  }

  const rootClass = [styles.fg, className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <span className={styles.fl}>
        {label}
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
      <div className={styles.tagField} onClick={() => inputRef.current?.focus()}>
        {items.map((item) => (
          <span key={item} className={styles.chip}>
            {item}
            <span
              className={styles.rm}
              role="button"
              tabIndex={0}
              aria-label={`Remove ${item}`}
              onClick={(e) => { e.stopPropagation(); onChange(items.filter((i) => i !== item)) }}
              onKeyDown={(e) => e.key === 'Enter' && onChange(items.filter((i) => i !== item))}
            >
              ×
            </span>
          </span>
        ))}
        <input
          ref={inputRef}
          className={styles.addTag}
          placeholder={items.length === 0 ? placeholder : ''}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
        />
      </div>
    </div>
  )
}
