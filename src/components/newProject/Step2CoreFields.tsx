import { useState, useRef } from 'react'
import type { ProjectStatus } from '../../types/project'
import { useWizardStore } from '../../store/wizardStore'
import TextField from '../project/TextField'
import Toggle from '../project/Toggle'
import ChipInput from '../project/ChipInput'
import UploadZone from '../project/UploadZone'
import styles from './Step2CoreFields.module.css'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'active',      label: 'Active' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'archived',    label: 'Archived' },
  { value: 'draft',       label: 'Draft' },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}


export default function Step2CoreFields() {
  const coreFields  = useWizardStore((s) => s.coreFields)
  const setCoreField = useWizardStore((s) => s.setCoreField)
  const setSeoField  = useWizardStore((s) => s.setSeoField)
  const setMetaField = useWizardStore((s) => s.setMetaField)

  const slugEdited = useRef(false)
  const [errors, setErrors] = useState<{ title?: string; slug?: string }>({})

  function setError(key: 'title' | 'slug', msg: string) {
    setErrors((e) => ({ ...e, [key]: msg }))
  }
  function clearError(key: 'title' | 'slug') {
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function handleTitleChange(v: string) {
    setCoreField({ title: v })
    if (!slugEdited.current) setCoreField({ slug: slugify(v) })
  }

  function handleTitleBlur() {
    if (!coreFields.title.trim()) setError('title', 'Title is required')
    else clearError('title')
  }

  function handleSlugChange(v: string) {
    slugEdited.current = true
    setCoreField({ slug: v })
  }

  function handleSlugBlur() {
    const s = coreFields.slug
    if (!s.trim()) {
      setError('slug', 'Slug is required')
    } else if (!/^[a-z0-9][a-z0-9-]*$/.test(s)) {
      setError('slug', 'Lowercase letters, numbers, and dashes only')
    } else {
      clearError('slug')
    }
  }

  const titleLen = coreFields.seo.metaTitle.length
  const descLen  = coreFields.seo.metaDescription.length

  return (
    <div>
      <p className={styles.intro}>
        <b>Tell us the basics.</b>{' '}
        Title, slug, excerpt, tech stack — everything that fills the project card and the SEO panel.
      </p>

      {/* ── Card 1: Basic info ─────────────────────────────────────── */}
      <div className={styles.card}>
        <span className={styles.cardTag}>/// basic info</span>
        <h3 className={styles.cardTitle}>About the project</h3>
        <div className={styles.form}>

          <TextField
            className={styles.fFull}
            label="Project title"
            hint="required"
            id="field-title"
            value={coreFields.title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            error={errors.title}
            placeholder="My awesome project"
          />

          {/* Slug — custom prefix display */}
          <div className={`${styles.fieldGroup} ${styles.fFull}`}>
            <label className={styles.fl} htmlFor="field-slug">
              Slug
              <span className={styles.hint}>auto-generated from title</span>
            </label>
            <div className={styles.slugWrap}>
              <span className={styles.slugPre}>/projects/</span>
              <input
                id="field-slug"
                className={`${styles.fi} ${styles.slugInput} ${errors.slug ? styles.fiError : ''}`}
                type="text"
                value={coreFields.slug}
                placeholder="my-project"
                onChange={(e) => handleSlugChange(e.target.value)}
                onBlur={handleSlugBlur}
              />
            </div>
            {errors.slug && <span className={styles.fieldError}>{errors.slug}</span>}
          </div>

          <TextField
            className={styles.fFull}
            label="Excerpt"
            hint="shown on project cards · ~160 chars"
            id="field-excerpt"
            value={coreFields.excerpt}
            onChange={(v) => setCoreField({ excerpt: v })}
            multiline
            rows={3}
            placeholder="A short description shown on project cards…"
          />

          {/* Status select */}
          <div className={styles.fieldGroup}>
            <label className={styles.fl} htmlFor="field-status">Status</label>
            <select
              id="field-status"
              className={`${styles.fi} ${styles.selectFi}`}
              value={coreFields.status}
              onChange={(e) => setCoreField({ status: e.target.value as ProjectStatus })}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <UploadZone
            label="Thumbnail"
            folder="projects/thumbnails"
            onComplete={(url) => setCoreField({ thumbnailUrl: url })}
            value={coreFields.thumbnailUrl || undefined}
          />

        </div>
      </div>

      {/* ── Card 2: Links & tech ────────────────────────────────────── */}
      <div className={styles.card}>
        <span className={styles.cardTag}>/// links &amp; tech</span>
        <h3 className={styles.cardTitle}>Where does it live?</h3>
        <div className={styles.form}>

          <TextField
            label="GitHub URL"
            value={coreFields.githubUrl}
            onChange={(v) => setCoreField({ githubUrl: v })}
            placeholder="github.com/user/repo"
          />

          <TextField
            label="Live demo URL"
            value={coreFields.demoUrl}
            onChange={(v) => setCoreField({ demoUrl: v })}
            placeholder="https://…"
          />

          <ChipInput
            className={styles.fFull}
            label="Tech stack"
            hint="press enter to add"
            items={coreFields.techStack}
            onChange={(items) => setCoreField({ techStack: items })}
          />

          <div className={styles.fFull}>
            <Toggle
              label="⚑ Featured project"
              subLabel="Show this on the home page featured strip."
              checked={coreFields.isFeatured}
              onChange={(v) => setCoreField({ isFeatured: v })}
            />
          </div>

        </div>
      </div>

      {/* ── Card 2b: Public page header ─────────────────────────────── */}
      <div className={styles.card}>
        <span className={styles.cardTag}>/// public page header</span>
        <h3 className={styles.cardTitle}>The detail-page masthead</h3>
        <p className={styles.seoExplainer}>
          These fill the editorial header at the top of the public project page — the kicker above
          the title (shown next to the publish year), plus the Role / Timeline / Status / Recognition
          meta grid. All optional; empty fields are simply hidden. Tip: add a "&nbsp;·&nbsp;" to fold
          a secondary detail into a value, e.g. <i>Live in production · v2.1</i>.
        </p>
        <div className={styles.form}>
          <TextField
            className={styles.fFull}
            label="Category / kicker"
            hint="small label above the title"
            value={coreFields.meta.category}
            onChange={(v) => setMetaField({ category: v })}
            placeholder="AI & Agents"
          />
          <TextField
            label="Role"
            value={coreFields.meta.role}
            onChange={(v) => setMetaField({ role: v })}
            placeholder="Solo — design & build · end to end"
          />
          <TextField
            label="Timeline"
            value={coreFields.meta.projectTimeline}
            onChange={(v) => setMetaField({ projectTimeline: v })}
            placeholder="Mar – Jun 2025 · ~10 weeks"
          />
          <TextField
            label="Status"
            value={coreFields.meta.displayStatus}
            onChange={(v) => setMetaField({ displayStatus: v })}
            placeholder="Live in production · v2.1"
          />
          <TextField
            className={styles.fFull}
            label="Recognition"
            hint="awards, milestones, press"
            value={coreFields.meta.recognition}
            onChange={(v) => setMetaField({ recognition: v })}
            placeholder="Featured project · 12k+ conversations served"
          />
        </div>
      </div>

      {/* ── Card 3: SEO ─────────────────────────────────────────────── */}
      <div className={styles.card}>
        <span className={styles.cardTag}>/// seo</span>
        <h3 className={styles.cardTitle}>Findable on the web</h3>
        <p className={styles.seoExplainer}>
          When Google crawls your project page, it reads these three things to decide how to show it
          in search results. The <b>meta title</b> becomes the blue clickable link, the{' '}
          <b>URL slug</b> is the page address, and the <b>meta description</b> is the one-line
          summary under the title. The <b>OG image</b> is what appears as the thumbnail when someone
          shares the link on Twitter, LinkedIn, or WhatsApp.
        </p>
        <div className={styles.form}>

          <TextField
            label="Meta title"
            hint="55–60 chars ideal"
            value={coreFields.seo.metaTitle}
            onChange={(v) => setSeoField({ metaTitle: v })}
            placeholder="Your project · Your name"
            note={
              <>
                This is the <strong>blue headline</strong> users click in Google.
                Keep it under 60 chars or Google truncates it with "…"
              </>
            }
          />

          <UploadZone
            label="OG / Social thumbnail"
            hint="1200 × 630 px"
            compact
            folder="system/og-images"
            onComplete={(url) => setSeoField({ ogImageUrl: url })}
            value={coreFields.seo.ogImageUrl || undefined}
            note={
              <>
                This image is shown when the link is{' '}
                <strong>shared on social media</strong>. 1200×630 px recommended.
              </>
            }
          />

          <TextField
            className={styles.fFull}
            label="Meta description"
            hint="150–160 chars ideal"
            value={coreFields.seo.metaDescription}
            onChange={(v) => setSeoField({ metaDescription: v })}
            multiline
            rows={2}
            placeholder="A one-line summary for search results…"
            note={
              <>
                The <strong>one-line summary</strong> shown under the title in search results.
                Google may rewrite this if it thinks something on the page is more relevant.
              </>
            }
          />

        </div>

        {/* Live SERP preview */}
        <div className={styles.seoLiveSection}>
          <div className={styles.seoLiveHead}>
            <span>Google Search Preview</span>
            <span className={styles.seoBadge}>SERP · live</span>
          </div>
          <div className={styles.serpCard}>
            <div className={styles.serpBreadcrumb}>
              <span className={styles.serpDomain}>uditnarayana.dev</span>
              {' › projects › '}
              {coreFields.slug || 'your-slug'}
            </div>
            <div className={styles.serpTitle}>
              {coreFields.seo.metaTitle || 'Your meta title will appear here'}
            </div>
            <div className={styles.serpDesc}>
              {coreFields.seo.metaDescription || 'Your meta description will appear here…'}
            </div>
          </div>
          <div className={styles.charCounter}>
            <span className={titleLen > 60 ? styles.counterWarn : titleLen >= 45 ? styles.counterOk : undefined}>
              {titleLen}/60 chars (title)
            </span>
            <span className={descLen > 160 ? styles.counterWarn : descLen >= 140 ? styles.counterOk : undefined}>
              {descLen}/160 chars (description)
            </span>
          </div>
        </div>

        {/* OG / Social card preview */}
        <div className={styles.ogPreviewWrap}>
          <div className={styles.ogPreviewHead}>
            <span>Social Share Preview</span>
            <span className={styles.ogBadge}>OG card · live</span>
          </div>
          <div className={styles.ogCard}>
            <div className={styles.ogCardImage}>
              {coreFields.seo.ogImageUrl ? (
                <img
                  src={coreFields.seo.ogImageUrl}
                  alt="OG preview"
                  className={styles.ogCardImg}
                />
              ) : (
                <div className={styles.ogImgPlaceholder}>
                  <span>🖼</span>
                  <span>No OG image uploaded yet</span>
                </div>
              )}
            </div>
            <div className={styles.ogCardBody}>
              <div className={styles.ogCardDomain}>uditnarayana.dev</div>
              <div className={styles.ogCardTitle}>
                {coreFields.seo.metaTitle || 'Your meta title'}
              </div>
              <div className={styles.ogCardDesc}>
                {coreFields.seo.metaDescription || 'Your meta description'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
