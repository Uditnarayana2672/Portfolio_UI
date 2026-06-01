import { useRef, useEffect, forwardRef } from 'react'
import { useFiltersStore } from '../../store/filtersStore'
import styles from './SearchInput.module.css'

const SearchInput = forwardRef<HTMLInputElement>((_, ref) => {
  const setSearch = useFiltersStore((s) => s.setSearch)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSearch(val), 300)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <div className={styles.wrap}>
      <span className={styles.glass} aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        className={styles.input}
        placeholder="Search by name, folder, format…"
        onChange={handleChange}
      />
      <span className={styles.kbd}>⌘/</span>
    </div>
  )
})

SearchInput.displayName = 'SearchInput'

export default SearchInput
