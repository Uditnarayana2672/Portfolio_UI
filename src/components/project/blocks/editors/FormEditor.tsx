import styles from './editors.module.css'

interface FormData { formId: string; formName: string }

const MOCK_FORMS = [
  { id: 'form-001', name: 'Contact / general enquiry' },
  { id: 'form-002', name: 'Project discovery call request' },
  { id: 'form-003', name: 'Jerry intake questionnaire' },
  { id: 'form-004', name: 'Bug report form' },
  { id: 'form-005', name: 'Beta access waitlist' },
]

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function FormEditor({ data, onChange }: Props) {
  const d = data as unknown as FormData

  function handleSelect(id: string) {
    const form = MOCK_FORMS.find((f) => f.id === id)
    onChange({ ...d, formId: form?.id ?? '', formName: form?.name ?? '' })
  }

  return (
    <div>
      <div className={styles.formLinkNotice}>
        <span className={styles.noticeIcon}>✎</span>
        <div className={styles.noticeBody}>
          <strong>Forms live in User Interaction Tools</strong><br />
          Pick an existing form to embed here. To build a new form — fields, validation,
          submission hooks — go to <strong>Admin → Polls &amp; forms</strong> and return to
          link it. Changes to the form are reflected everywhere it's embedded.
        </div>
      </div>

      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>Select an existing form</label>
          <select
            className={`${styles.fi} ${styles.fiSelect}`}
            value={d.formId}
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="">— choose a form —</option>
            {MOCK_FORMS.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {d.formId && (
        <div className={styles.edRow}>
          <div className={styles.linkedFormCard}>
            <div className={styles.linkedFormCardHead}>Linked form</div>
            <div className={styles.linkedFormName}>{d.formName}</div>
            <div className={styles.linkedFormId}>{d.formId}</div>
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.formCreateBtn}
        onClick={() => window.open('#admin-forms', '_blank')}
      >
        <span>+</span> Create a new form in Polls &amp; forms ↗
      </button>
    </div>
  )
}
