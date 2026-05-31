import styles from './EmptyState.module.css'

export default function EmptyState() {
  function scrollToDropzone() {
    document.getElementById('dropzone-anchor')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={`${styles.emptyState} wobble`}>
      <div className={styles.glyph}>∅</div>
      <h3 className={styles.heading}>No media yet</h3>
      <p className={styles.body}>Upload images, videos, or documents to see them here.</p>
      <button className={styles.btn} onClick={scrollToDropzone}>+ Upload</button>
    </div>
  )
}
