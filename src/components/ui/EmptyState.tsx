import { useFiltersStore } from '../../store/filtersStore'
import styles from './EmptyState.module.css'

export default function EmptyState() {
  const search = useFiltersStore((s) => s.search)

  function scrollToDropzone() {
    document.getElementById('dropzone-anchor')?.scrollIntoView({ behavior: 'smooth' })
  }

  const heading = search ? `No assets matching "${search}"` : 'No media yet'
  const body    = search
    ? 'Try adjusting your search or clearing the filters.'
    : 'Upload images, videos, or documents to see them here.'

  return (
    <div className={`${styles.emptyState} wobble`}>
      <div className={styles.glyph}>∅</div>
      <h3 className={styles.heading}>{heading}</h3>
      <p className={styles.body}>{body}</p>
      {!search && (
        <button className={styles.btn} onClick={scrollToDropzone}>+ Upload</button>
      )}
    </div>
  )
}
