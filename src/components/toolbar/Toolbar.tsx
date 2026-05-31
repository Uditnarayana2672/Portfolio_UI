import { useRef } from 'react'
import { useFiltersStore } from '../../store/filtersStore'
import type { MediaFilters } from '../../types/media'
import SearchInput from './SearchInput'
import ViewToggle from './ViewToggle'
import styles from './Toolbar.module.css'

type SortField = MediaFilters['sort_by']
type SortOrder = MediaFilters['order']

const SORT_OPTIONS: { value: string; label: string; field: SortField; order: SortOrder }[] = [
  { value: 'created_at:desc', label: 'Sort: newest first', field: 'created_at', order: 'desc' },
  { value: 'created_at:asc',  label: 'oldest first',       field: 'created_at', order: 'asc'  },
  { value: 'file_size:desc',  label: 'largest file',        field: 'file_size',  order: 'desc' },
  { value: 'file_name:asc',   label: 'filename A→Z',        field: 'file_name',  order: 'asc'  },
]

export default function Toolbar() {
  const sort_by    = useFiltersStore((s) => s.sort_by)
  const order      = useFiltersStore((s) => s.order)
  const setSortBy  = useFiltersStore((s) => s.setSortBy)
  const setOrder   = useFiltersStore((s) => s.setOrder)
  const searchRef  = useRef<HTMLInputElement>(null)

  const sortValue = `${sort_by}:${order}`

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const opt = SORT_OPTIONS.find((o) => o.value === e.target.value)
    if (opt) {
      setSortBy(opt.field)
      setOrder(opt.order)
    }
  }

  const handleUploadClick = () => {
    document.getElementById('dropzone-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div className={`${styles.toolbar} wobble`}>
      <SearchInput ref={searchRef} />

      <select
        className={styles.sortSelect}
        value={sortValue}
        onChange={handleSortChange}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <ViewToggle />

      <button className={`${styles.btn} ${styles.primary}`} onClick={handleUploadClick}>
        <span className={styles.plus}>+</span> Upload
      </button>
    </div>
  )
}
