import styles from './editors.module.css'

interface FormData { formId: string; formName: string }

// Fixed form types. Submissions arrive in Admin → Inbox.
const FORMS = [
  { id: 'contact', name: 'Contact / general enquiry' },
  { id: 'discovery', name: 'Project discovery call request' },
  { id: 'feedback', name: 'Feedback' },
]
const LEGACY_IDS: Record<string, string> = { 'form-001': 'contact', 'form-002': 'discovery', 'form-004': 'feedback' }

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function FormEditor({ data, onChange }: Props) {
  const d = data as unknown as FormData

  function handleSelect(id: string) {
    const form = FORMS.find((f) => f.id === id)
    onChange({ ...d, formId: form?.id ?? '', formName: form?.name ?? '' })
  }

  return (
    <div>
      <div className={styles.formLinkNotice}>
        <span className={styles.noticeIcon}>✎</span>
        <div className={styles.noticeBody}>
          <strong>Visitors fill this in on the project page.</strong><br />
          Their message arrives in Admin → Inbox, and by email once email is set up.
        </div>
      </div>

      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>Select an existing form</label>
          <select
            className={`${styles.fi} ${styles.fiSelect}`}
            value={LEGACY_IDS[d.formId] ?? d.formId}
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="">— choose a form —</option>
            {FORMS.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

    </div>
  )
}
