import { type TemplateId, useWizardStore } from '../../store/wizardStore'
import styles from './Step1Template.module.css'

interface TemplateDef {
  id: TemplateId
  name: string
  desc: string
  preview: React.ReactNode
}

const TEMPLATES: TemplateDef[] = [
  {
    id: 'narrative',
    name: 'Narrative',
    desc: 'Long-form editorial prose. Pull quotes, story arc.',
    preview: (
      <>
        <div className={`${styles.tw} ${styles.h} ${styles.med}`} />
        <div className={styles.tw} />
        <div className={`${styles.tw} ${styles.med}`} />
        <div className={`${styles.tw} ${styles.short}`} />
        <div className={styles.tw} />
      </>
    ),
  },
  {
    id: 'technical',
    name: 'Technical',
    desc: 'Sidebar specs + main column. Engineers love it.',
    preview: (
      <>
        <div className={`${styles.tw} ${styles.h} ${styles.med}`} />
        <div className={styles.twRow}>
          <div className={`${styles.twCol} ${styles.twColWide}`}>
            <div className={styles.tw} />
            <div className={`${styles.tw} ${styles.short}`} />
            <div className={`${styles.tw} ${styles.med}`} />
          </div>
          <div className={styles.twDivider} />
          <div className={styles.twCol}>
            <div className={`${styles.tw} ${styles.short}`} />
            <div className={styles.tw} />
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'visual',
    name: 'Visual',
    desc: 'Big hero, gallery grid. Media first.',
    preview: (
      <>
        <div className={styles.twSq} style={{ height: 36 }} />
        <div className={styles.twRow}>
          <div className={styles.twSq} style={{ height: 22 }} />
          <div className={styles.twSq} style={{ height: 22 }} />
          <div className={styles.twSq} style={{ height: 22 }} />
        </div>
        <div className={`${styles.tw} ${styles.short}`} />
      </>
    ),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Narrow centered column. Pure type.',
    preview: (
      <div className={styles.minimalInner}>
        <div className={`${styles.tw} ${styles.h}`} />
        <div className={`${styles.tw} ${styles.short}`} />
        <div className={styles.tw} />
        <div className={`${styles.tw} ${styles.med}`} />
        <div className={styles.tw} />
      </div>
    ),
  },
  {
    id: 'interactive',
    name: 'Interactive',
    desc: 'Split view with live demo embed.',
    preview: (
      <div className={`${styles.twRow} ${styles.twRowFull}`}>
        <div className={styles.twCol}>
          <div className={styles.tw} />
          <div className={`${styles.tw} ${styles.short}`} />
          <div className={`${styles.tw} ${styles.med}`} />
        </div>
        <div className={styles.twDivider} />
        <div className={styles.twCol}>
          <div className={`${styles.twSq} ${styles.twSqFull}`} />
        </div>
      </div>
    ),
  },
]

export default function Step1Template() {
  const selected = useWizardStore((s) => s.selectedTemplate)
  const setTemplate = useWizardStore((s) => s.setTemplate)

  return (
    <div className={styles.root}>
      <p className={styles.intro}>
        <b>Choose a layout template.</b>{' '}
        Each template gives you a different way to tell this project's story.
        You can switch later without losing content.
      </p>
      <div className={styles.tmplGrid}>
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className={[
              styles.tmplCard,
              selected === tpl.id ? styles.sel : '',
            ].join(' ')}
            onClick={() => setTemplate(tpl.id)}
            aria-pressed={selected === tpl.id}
          >
            {selected === tpl.id && (
              <span className={styles.selBadge}>✓ selected</span>
            )}
            <div className={styles.tmplPreview}>{tpl.preview}</div>
            <div className={styles.tmplName}>{tpl.name}</div>
            <div className={styles.tmplDesc}>{tpl.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
