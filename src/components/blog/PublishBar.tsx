import { useEffect, useState } from 'react'
import { useBlogEditorStore } from '../../store/blogEditorStore'
import { formatZoned, isoToZonedLocal, zonedLocalToIso } from '../../lib/zonedTime'
import s from './blogUi.module.css'

interface Props {
  busy: string | null
  scheduleOpen: boolean
  setScheduleOpen: (open: boolean) => void
  onPreview: () => void
  onHistory: () => void
  onSaveDraft: () => void
  onPublish: () => void
  onSchedule: (iso: string) => void
  onUnschedule: () => void
  onUnpublish: () => void
  onDiscard: () => void
  onDelete: () => void
}

function ago(ms: number) {
  const sec = Math.max(0, Math.round((Date.now() - ms) / 1000))
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec} sec ago`
  const min = Math.round(sec / 60)
  return min < 60 ? `${min} min ago` : `${Math.round(min / 60)} h ago`
}

function SaveIndicator() {
  const saveState = useBlogEditorStore((x) => x.saveState)
  const saveError = useBlogEditorStore((x) => x.saveError)
  const lastSavedAt = useBlogEditorStore((x) => x.lastSavedAt)
  const postId = useBlogEditorStore((x) => x.postId)
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 5000)
    return () => clearInterval(t)
  }, [])

  let dot = s.dotOk
  let text = lastSavedAt ? `Saved · ${ago(lastSavedAt)}` : 'Saved'
  if (!postId && saveState === 'idle') {
    dot = s.dotIdle
    text = 'Not saved yet — add a title to start'
  } else if (saveState === 'saving') {
    dot = s.dotBusy
    text = 'Saving…'
  } else if (saveState === 'offline') {
    dot = s.dotWarn
    text = 'Offline — retrying'
  } else if (saveState === 'conflict') {
    dot = s.dotBad
    text = 'Edited in another tab'
  } else if (saveState === 'error') {
    dot = s.dotBad
    text = `Not saved: ${saveError ?? 'error'}`
  }
  return (
    <span className={s.saveState} title={saveError ?? undefined} aria-live="polite">
      <span className={`${s.saveDot} ${dot}`} /> {text}
    </span>
  )
}

function SchedulePopover({ busy, onSchedule, onUnschedule, onClose }: {
  busy: boolean
  onSchedule: (iso: string) => void
  onUnschedule: () => void
  onClose: () => void
}) {
  const post = useBlogEditorStore((x) => x.post)
  const checklist = useBlogEditorStore((x) => x.checklist)
  const tz = useBlogEditorStore((x) => x.config?.timezone) ?? 'Asia/Kolkata'
  const minLead = useBlogEditorStore((x) => x.config?.limits.schedule_min_lead_minutes) ?? 5
  const scheduled = post?.status === 'scheduled'
  // Mounted fresh on every open, so these initial values are "now".
  const [minLocal] = useState(() => isoToZonedLocal(new Date(Date.now() + minLead * 60000).toISOString(), tz))
  const [when, setWhen] = useState(() =>
    isoToZonedLocal(post?.scheduled_at ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(), tz),
  )

  return (
    <div className={s.popover} role="dialog" aria-label="Schedule">
      <div className={s.popTitle}>Publish automatically at</div>
      <input
        type="datetime-local"
        className={s.input}
        value={when}
        min={minLocal}
        onChange={(e) => setWhen(e.target.value)}
      />
      <div className={s.note}>
        Time zone: {tz === 'Asia/Kolkata' ? 'IST' : tz}. It publishes on its own if every blocker in
        the checklist is still green; if not, it goes back to Draft and tells you why.
      </div>
      {checklist && !checklist.can_publish && (
        <div className={s.error}>Fix {checklist.blocker_count} checklist blocker(s) first.</div>
      )}
      <div className={s.popActs}>
        {scheduled && <button type="button" className={s.btnGhost} onClick={onUnschedule}>Unschedule</button>}
        <button type="button" className={s.btnGhost} onClick={onClose}>Cancel</button>
        <button type="button" className={s.btnPrimary} disabled={!when || busy} onClick={() => onSchedule(zonedLocalToIso(when, tz))}>
          {scheduled ? 'Update schedule' : 'Schedule'}
        </button>
      </div>
    </div>
  )
}

export default function PublishBar(p: Props) {
  const post = useBlogEditorStore((x) => x.post)
  const postId = useBlogEditorStore((x) => x.postId)
  const hasChanges = useBlogEditorStore((x) => x.hasUnpublishedChanges)
  const tz = useBlogEditorStore((x) => x.config?.timezone) ?? 'Asia/Kolkata'
  const [menuOpen, setMenuOpen] = useState(false)

  const status = post?.status ?? 'draft'
  const live = status === 'published'
  const scheduled = status === 'scheduled'

  const pill = live
    ? hasChanges ? 'Published · unpublished changes' : 'Published'
    : scheduled && post?.scheduled_at ? `Scheduled · ${formatZoned(post.scheduled_at, tz)}` : 'Draft'
  const pillClass = live ? s.pillLive : scheduled ? s.pillScheduled : s.pillDraft

  return (
    <div className={`${s.publishBar} wobble`}>
      <div className={s.pbLeft}>
        <span className={`${s.pill} ${pillClass}`}>{live ? '●' : scheduled ? '◷' : '○'} {pill}</span>
        <SaveIndicator />
      </div>
      <div className={s.pbActs}>
        <button type="button" className={s.btnGhost} onClick={p.onPreview} disabled={!postId}>⌕ Preview</button>
        <button type="button" className={s.btnGhost} onClick={p.onHistory} disabled={!postId}>⟲ History</button>
        <button type="button" className={s.btnGhost} onClick={p.onSaveDraft} disabled={!postId || !!p.busy}
          title="Save a named version (Ctrl/⌘+S)">
          Save draft
        </button>
        <span className={s.pbDivider} />
        {!live && (
          <div className={s.popWrap}>
            <button type="button" className={s.btn} onClick={() => p.setScheduleOpen(!p.scheduleOpen)} disabled={!postId || !!p.busy}>
              📅 {scheduled ? 'Reschedule' : 'Schedule'}
            </button>
            {p.scheduleOpen && (
              <SchedulePopover
                busy={!!p.busy}
                onSchedule={p.onSchedule}
                onUnschedule={p.onUnschedule}
                onClose={() => p.setScheduleOpen(false)}
              />
            )}
          </div>
        )}
        <button
          type="button"
          className={s.btnPrimary}
          onClick={p.onPublish}
          disabled={!postId || !!p.busy || (live && !hasChanges)}
          title={live && !hasChanges ? 'The live post is up to date' : undefined}
        >
          {p.busy === 'publish' ? 'Publishing…' : live ? '↗ Update' : '↗ Publish'}
        </button>
        <div className={s.popWrap}>
          <button type="button" className={s.btnIcon} onClick={() => setMenuOpen(!menuOpen)} aria-label="More actions" disabled={!postId}>⋯</button>
          {menuOpen && (
            <div className={s.menu} onMouseLeave={() => setMenuOpen(false)}>
              {live && post?.public_url && (
                <a className={s.menuItem} href={post.public_url} target="_blank" rel="noreferrer">View live post ↗</a>
              )}
              {live && hasChanges && (
                <button type="button" className={s.menuItem} onClick={() => { setMenuOpen(false); p.onDiscard() }}>
                  Discard unpublished changes
                </button>
              )}
              {live && (
                <button type="button" className={s.menuItem} onClick={() => { setMenuOpen(false); p.onUnpublish() }}>
                  Unpublish
                </button>
              )}
              {!post?.published_at && !live && (
                <button type="button" className={`${s.menuItem} ${s.menuDanger}`} onClick={() => { setMenuOpen(false); p.onDelete() }}>
                  Delete draft
                </button>
              )}
              {post?.published_at && !live && <div className={s.menuNote}>Was live before — archive it from Blog Manager.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
