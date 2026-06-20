import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWizardStore } from '../../store/wizardStore'
import { createDraftProject, addProjectBlock, publishProject } from '../../api/projectApi'
import styles from './Step5Publish.module.css'

const BLOCK_ICONS: Record<string, string> = {
  hero: '⬚', text: '¶', image: '⊞', code: '</>',
  gallery: '⊟', video: '▶', quote: '"', stats: '≡',
  comparison: '⇄', timeline: '○', poll: '◉', form: '☐', cta: '→',
}

const BLOCK_LABELS: Record<string, string> = {
  hero: 'Hero', text: 'Text', image: 'Image', code: 'Code',
  gallery: 'Gallery', video: 'Video', quote: 'Quote', stats: 'Stats',
  comparison: 'Comparison', timeline: 'Timeline', poll: 'Poll', form: 'Form', cta: 'CTA',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active', maintenance: 'Maintenance', archived: 'Archived', draft: 'Draft',
}

function CheckRow({
  pass, warn = false, label,
}: { pass: boolean; warn?: boolean; label: string }) {
  return (
    <div className={[styles.checkRow, pass ? styles.pass : warn ? styles.warn : styles.fail].join(' ')}>
      <span className={styles.checkIcon}>{pass ? '✓' : warn ? '⚠' : '○'}</span>
      <span>{label}</span>
    </div>
  )
}

export default function Step5Publish() {
  const navigate = useNavigate()
  const { selectedTemplate, coreFields, blocks } = useWizardStore()
  const {
    title, slug, excerpt, status,
    thumbnailUrl, githubUrl, demoUrl,
    techStack, isFeatured, seo,
  } = coreFields

  const [busy, setBusy]   = useState<'publish' | 'draft' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Readiness flags ────────────────────────────────────────────────
  const hasTitle    = title.trim().length > 0
  const hasSlug     = slug.trim().length > 0
  const hasBlocks   = blocks.length > 0
  const hasSeoTitle = (seo.metaTitle ?? '').trim().length > 0
  const hasExcerpt  = excerpt.trim().length > 0
  const hasThumb    = !!thumbnailUrl
  const hasSeoDesc  = (seo.metaDescription ?? '').trim().length > 0

  // Publish gate: backend also requires title + ≥1 block + seo.meta_title
  const canPublish = hasTitle && hasSlug && hasBlocks && hasSeoTitle
  const canDraft   = hasTitle

  // ── Submit handler ─────────────────────────────────────────────────
  async function submit(intent: 'publish' | 'draft') {
    setError(null)
    setBusy(intent)
    try {
      // 1. Create draft project
      const project = await createDraftProject({
        title,
        slug,
        excerpt,
        template_id: selectedTemplate,
        tech_stack:  techStack,
        github_url:  githubUrl || null,
        demo_url:    demoUrl   || null,
        is_featured: isFeatured,
        seo: {
          meta_title:       seo.metaTitle       || null,
          meta_description: seo.metaDescription || null,
          og_image_url:     seo.ogImageUrl      || null,
        },
      })

      // 2. Add blocks sequentially (position = index)
      for (let i = 0; i < blocks.length; i++) {
        await addProjectBlock(
          project.id,
          { type_id: blocks[i].typeId, data: blocks[i].data ?? {} },
          i,
        )
      }

      // 3. Publish if requested
      if (intent === 'publish') {
        await publishProject(project.id)
      }

      navigate('/admin/projects')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  // ── Preview data ───────────────────────────────────────────────────
  const serpTitle = (seo.metaTitle ?? '').trim()       || title    || 'Untitled'
  const serpDesc  = (seo.metaDescription ?? '').trim() || excerpt  || 'No description set.'
  const domain    = 'uditnarayana.dev'

  return (
    <div className={styles.root}>

      {/* ── Intro ───────────────────────────────────────────── */}
      <div className={styles.intro}>
        <span className={styles.introIcon}>⊙</span>
        <div>
          <div className={styles.introTitle}>Preview &amp; Publish</div>
          <p className={styles.introBody}>
            Review your project, check the readiness list, then publish or save as a draft.
          </p>
        </div>
      </div>

      <div className={styles.cols}>

        {/* ── Left: Live preview ──────────────────────────── */}
        <div className={styles.previewCol}>

          {/* Project card */}
          <div className={styles.card}>
            <div className={styles.cardTag}>live preview</div>

            {thumbnailUrl
              ? <img className={styles.thumb} src={thumbnailUrl} alt="thumbnail" />
              : <div className={styles.thumbEmpty}>no thumbnail set</div>
            }

            <div className={styles.cardBody}>
              <div className={styles.metaRow}>
                <span className={styles.tplBadge}>{selectedTemplate}</span>
                {status && (
                  <span className={`${styles.statusBadge} ${styles[`s_${status}`] ?? ''}`}>
                    {status === 'draft' ? '○' : '●'} {STATUS_LABEL[status] ?? status}
                  </span>
                )}
                {isFeatured && <span className={styles.featuredBadge}>★ Featured</span>}
              </div>

              <h2 className={styles.previewTitle}>{title || 'Untitled project'}</h2>
              <div className={styles.previewSlug}>/{slug || 'no-slug-set'}</div>

              {excerpt && <p className={styles.previewExcerpt}>{excerpt}</p>}

              {techStack.length > 0 && (
                <div className={styles.techRow}>
                  {techStack.map(t => (
                    <span key={t} className={styles.techChip}>{t}</span>
                  ))}
                </div>
              )}

              {blocks.length > 0 && (
                <div className={styles.blocksSection}>
                  <span className={styles.blocksLabel}>
                    {blocks.length} block{blocks.length !== 1 ? 's' : ''}
                  </span>
                  <div className={styles.blockPills}>
                    {blocks.map(b => (
                      <span key={b.id} className={styles.blockPill}>
                        {BLOCK_ICONS[b.typeId] ?? '▪'} {BLOCK_LABELS[b.typeId] ?? b.typeId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(githubUrl || demoUrl) && (
                <div className={styles.linksRow}>
                  {githubUrl && <span className={styles.linkChip}>⌥ GitHub</span>}
                  {demoUrl   && <span className={styles.linkChip}>↗ Live demo</span>}
                </div>
              )}
            </div>
          </div>

          {/* SEO / SERP snippet */}
          <div className={styles.card}>
            <div className={styles.cardTag}>seo preview</div>
            <div className={styles.serp}>
              <div className={styles.serpDomain}>{domain} › projects › {slug || '…'}</div>
              <div className={styles.serpTitle}>{serpTitle}</div>
              <div className={styles.serpDesc}>{serpDesc}</div>
            </div>
          </div>

        </div>

        {/* ── Right: Checklist + actions ───────────────────── */}
        <div className={styles.panel}>

          <div className={styles.checklist}>
            <div className={styles.cardTag}>readiness checklist</div>

            <CheckRow pass={hasTitle}
              label={hasTitle ? `Title: "${title}"` : 'Title — required'} />
            <CheckRow pass={hasSlug}
              label={hasSlug ? `Slug: /${slug}` : 'Slug — required'} />
            <CheckRow pass={hasBlocks}
              label={hasBlocks
                ? `${blocks.length} content block${blocks.length !== 1 ? 's' : ''} added`
                : 'At least 1 content block — required'} />
            <CheckRow pass={hasSeoTitle}
              label={hasSeoTitle ? 'SEO title set' : 'SEO title — required to publish'} />
            <CheckRow pass={hasExcerpt}  warn={!hasExcerpt}
              label={hasExcerpt ? 'Excerpt filled in'   : 'Excerpt — recommended'} />
            <CheckRow pass={hasThumb}    warn={!hasThumb}
              label={hasThumb   ? 'Thumbnail uploaded'  : 'Thumbnail — recommended'} />
            <CheckRow pass={hasSeoDesc}  warn={!hasSeoDesc}
              label={hasSeoDesc ? 'Meta description set': 'Meta description — recommended'} />
          </div>

          {error && (
            <div className={styles.errorBanner}>✕ {error}</div>
          )}

          <div className={styles.actions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!canPublish || busy !== null}
              onClick={() => submit('publish')}
            >
              {busy === 'publish' ? 'Publishing…' : '↑ Publish'}
            </button>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              disabled={!canDraft || busy !== null}
              onClick={() => submit('draft')}
            >
              {busy === 'draft' ? 'Saving…' : '⊟ Save as draft'}
            </button>
          </div>

          <p className={styles.actionNote}>
            Publish makes your project live immediately.
            Save as draft keeps it hidden until you publish later.
          </p>

        </div>
      </div>
    </div>
  )
}
