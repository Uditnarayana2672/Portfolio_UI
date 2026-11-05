import { useEffect, useMemo, useState } from 'react'
import { BlogApiError } from '../../api/blogApi'
import { getPortfolioContent, savePortfolioContent } from '../../api/portfolioApi'
import type { AdminPortfolioContent, PortfolioDocument } from '../../types/portfolio'
import { ErrorsContext } from './portfolioHelpers'
import { AboutTab, EducationTab, ExperienceTab, HeroTab, TechTab, WhatIDoTab } from './tabs'
import { useUnsavedGuard } from './useUnsavedGuard'
import styles from './PortfolioInfo.module.css'

const TABS = [
  { id: 'hero', label: 'Hero', sections: ['hero'], Component: HeroTab },
  { id: 'about', label: 'About', sections: ['about'], Component: AboutTab },
  { id: 'what', label: 'What I do', sections: ['what_i_do'], Component: WhatIDoTab },
  { id: 'tech', label: 'Tech & skills', sections: ['skills', 'tech'], Component: TechTab },
  { id: 'experience', label: 'Experience', sections: ['experience_section', 'experience'], Component: ExperienceTab },
  { id: 'education', label: 'Education', sections: ['education_section', 'education'], Component: EducationTab },
] as const

type TabId = (typeof TABS)[number]['id']
type Notice = { kind: 'error' | 'conflict' | 'saved'; message: string } | null

const sectionOf = (path: string) => path.split(/[.[]/)[0]

function tabForPath(path: string): TabId | undefined {
  return TABS.find((t) => (t.sections as readonly string[]).includes(sectionOf(path)))?.id
}

function formatSaved(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function PortfolioInfo() {
  const [saved, setSaved] = useState<AdminPortfolioContent | null>(null)
  const [content, setContent] = useState<PortfolioDocument | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [tab, setTab] = useState<TabId>('hero')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let current = true
    getPortfolioContent().then(
      (doc) => {
        if (!current) return
        setSaved(doc)
        setContent(doc.content)
        setErrors({})
        setNotice(null)
      },
      () => { if (current) setLoadFailed(true) },
    )
    return () => { current = false }
  }, [loadAttempt])

  const reload = () => {
    setLoadFailed(false)
    setLoadAttempt((n) => n + 1)
  }

  const dirty = useMemo(
    () => !!saved && !!content && JSON.stringify(saved.content) !== JSON.stringify(content),
    [saved, content],
  )
  useUnsavedGuard(dirty)

  const errorCounts = useMemo(() => {
    const counts: Partial<Record<TabId, number>> = {}
    for (const path of Object.keys(errors)) {
      const id = tabForPath(path)
      if (id) counts[id] = (counts[id] ?? 0) + 1
    }
    return counts
  }, [errors])

  function edit(next: PortfolioDocument) {
    setContent(next)
    if (notice?.kind === 'saved') setNotice(null)
  }

  async function save() {
    if (!saved || !content || saving) return
    setSaving(true)
    setNotice(null)
    try {
      const result = await savePortfolioContent(saved.version, content)
      setSaved(result)
      setContent(result.content)
      setErrors({})
      setNotice({ kind: 'saved', message: 'Saved. Your changes are live.' })
    } catch (err) {
      if (err instanceof BlogApiError && err.code === 'VERSION_CONFLICT') {
        setNotice({ kind: 'conflict', message: err.message })
      } else if (err instanceof BlogApiError && err.code === 'INVALID_CONTENT') {
        const fields = (err.detail.fields ?? []) as { path: string; message: string }[]
        const mapped = Object.fromEntries(fields.map((f) => [f.path, f.message]))
        setErrors(mapped)
        const first = fields[0] && tabForPath(fields[0].path)
        if (first) setTab(first)
        setNotice({ kind: 'error', message: `${fields.length === 1 ? '1 field needs' : `${fields.length} fields need`} fixing before saving.` })
      } else {
        const message = err instanceof Error ? err.message : 'Something went wrong.'
        setNotice({ kind: 'error', message: `Couldn’t save: ${message} Your edits are still here.` })
      }
    } finally {
      setSaving(false)
    }
  }

  const active = TABS.find((t) => t.id === tab) ?? TABS[0]
  const ActiveTab = active.Component

  return (
    <section aria-labelledby="portfolio-title" className={styles.section}>
      <h2 id="portfolio-title" className={styles.title}>Portfolio info</h2>
      <p className={styles.intro}>The text on your main portfolio page. Pressing Save makes it live.</p>

      {!content && !loadFailed && <p className={styles.intro}>Loading…</p>}
      {!content && loadFailed && (
        <p className={styles.noticeError} role="alert">
          Couldn’t load the portfolio content. <button className={styles.inlineBtn} onClick={reload}>Retry</button>
        </p>
      )}

      {content && saved && (
        <>
          <div className={styles.tabs} role="tablist" aria-label="Portfolio sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={t.id === tab}
                className={`${styles.tab}${t.id === tab ? ` ${styles.tabOn}` : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {errorCounts[t.id] ? <span className={styles.tabErrors}>{errorCounts[t.id]}</span> : null}
              </button>
            ))}
          </div>

          <div className={styles.panel} role="tabpanel">
            <ErrorsContext.Provider value={errors}>
              <ActiveTab content={content} onChange={edit} />
            </ErrorsContext.Provider>
          </div>

          <div className={styles.saveBar}>
            <div className={styles.saveStatus} aria-live="polite">
              {notice?.kind === 'conflict' && (
                <span className={styles.noticeError}>
                  {notice.message} <button className={styles.inlineBtn} onClick={reload}>Reload (discards my edits)</button>
                </span>
              )}
              {notice?.kind === 'error' && <span className={styles.noticeError}>{notice.message}</span>}
              {notice?.kind === 'saved' && <span className={styles.noticeOk}>{notice.message}</span>}
              {!notice && (dirty
                ? <span className={styles.unsaved}>Unsaved changes</span>
                : <span>Last saved {formatSaved(saved.updated_at)}{saved.updated_by_name ? ` by ${saved.updated_by_name}` : ''}</span>)}
            </div>
            <button className={styles.saveBtn} disabled={!dirty || saving} onClick={save}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
