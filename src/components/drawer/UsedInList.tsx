import type { UsageReference } from '../../types/media'
import styles from './UsedInList.module.css'

interface Props {
  references: UsageReference[]
}

export default function UsedInList({ references }: Props) {
  return (
    <div className={styles.section}>
      <h4 className={styles.heading}>
        Used in {references.length} place{references.length !== 1 ? 's' : ''}
      </h4>

      {references.length === 0 ? (
        <p className={styles.empty}>Not used anywhere yet</p>
      ) : (
        <div className={styles.usedIn}>
          {references.map((ref) => {
            const kindClass = styles[ref.kind as keyof typeof styles] ?? ''
            return (
              <div key={ref.id} className={styles.uir}>
                <span className={`${styles.kindTag} ${kindClass}`}>
                  {ref.kind}
                </span>
                <span className={styles.where} title={ref.title ?? ref.location}>
                  {ref.title ?? ref.location}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
