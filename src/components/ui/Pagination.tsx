import { useFiltersStore } from '../../store/filtersStore'
import styles from './Pagination.module.css'

interface Props {
  total: number
}

function getPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = []
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  pages.push(1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)

  return pages
}

export default function Pagination({ total }: Props) {
  const page    = useFiltersStore((s) => s.page)
  const limit   = useFiltersStore((s) => s.limit)
  const setPage = useFiltersStore((s) => s.setPage)

  const totalPages = Math.ceil(total / limit)

  if (total === 0 || totalPages <= 1) return null

  const startItem = (page - 1) * limit + 1
  const endItem   = Math.min(page * limit, total)

  const goTo = (n: number) => {
    setPage(n)
    document.getElementById('media-content')?.scrollIntoView({ behavior: 'smooth' })
  }

  const pageRange = getPageRange(page, totalPages)

  return (
    <div className={styles.pagination}>
      <span className={styles.showing}>
        Showing {startItem}–{endItem} of {total}
      </span>

      <div className={styles.controls}>
        <button
          className={styles.btn}
          disabled={page === 1}
          onClick={() => goTo(page - 1)}
        >
          ‹ Prev
        </button>

        {pageRange.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              className={`${styles.pill} ${p === page ? styles.active : ''}`}
              onClick={() => goTo(p as number)}
            >
              {p}
            </button>
          )
        )}

        <button
          className={styles.btn}
          disabled={page === totalPages}
          onClick={() => goTo(page + 1)}
        >
          Next ›
        </button>
      </div>
    </div>
  )
}
