import { useEffect, useState } from 'react'
import { getRevision, listRevisions } from '../../api/blogApi'
import type { RevisionDetail, RevisionSummary } from '../../types/blog'
import { formatZoned } from '../../lib/zonedTime'
import s from './blogUi.module.css'

interface Props {
  postId: string
  timeZone: string
  onRestore: (revisionId: string) => void
  onClose: () => void
}

const KIND_LABEL: Record<RevisionSummary['kind'], string> = {
  publish: 'Published', manual: 'Saved', restore: 'Safety copy',
}

export default function HistoryDrawer({ postId, timeZone, onRestore, onClose }: Props) {
  const [items, setItems] = useState<RevisionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<RevisionDetail | null>(null)

  useEffect(() => {
    listRevisions(postId)
      .then((r) => setItems(r.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load history'))
      .finally(() => setLoading(false))
  }, [postId])

  return (
    <div className={s.drawerBackdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={s.drawer} role="dialog" aria-label="Revision history">
        <div className={s.modalHead}>
          <span className={s.modalTitle}>{open ? (open.label ?? KIND_LABEL[open.kind]) : 'History'}</span>
          {open && <button type="button" className={s.btnSmall} onClick={() => setOpen(null)}>← all versions</button>}
          <button type="button" className={s.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>
        {!open ? (
          <div className={s.drawerBody}>
            <p className={s.note}>
              Autosave keeps your latest work. Versions are kept when you press Save draft, Publish or Update,
              and a safety copy is made before every restore or discard.
            </p>
            {loading && <div className={s.note}>Loading…</div>}
            {error && <div className={s.error}>{error}</div>}
            {!loading && !items.length && <div className={s.note}>No saved versions yet — press Save draft.</div>}
            <ul className={s.revList}>
              {items.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={s.revItem}
                    onClick={() => getRevision(postId, r.id).then(setOpen).catch((e) => setError(String(e?.message ?? e)))}
                  >
                    <span className={`${s.revKind} ${s[`rev_${r.kind}`] ?? ''}`}>{KIND_LABEL[r.kind]}</span>
                    <span className={s.revLabel}>{r.label}</span>
                    {r.is_live && <span className={s.revLive}>live</span>}
                    <span className={s.revMeta}>{formatZoned(r.created_at, timeZone)} · {r.word_count} words</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className={s.drawerBody}>
            <div className={s.revMeta}>{formatZoned(open.created_at, timeZone)} · {open.word_count} words</div>
            <h2 className={s.revTitle}>{String(open.snapshot.title ?? '')}</h2>
            {/* Server-rendered from allowlisted content and escaped — safe to inject. */}
            <article className="bp-article bp-article--compact" dangerouslySetInnerHTML={{ __html: open.content_html }} />
            <div className={s.drawerFoot}>
              <span className={s.note}>Restoring replaces the editor’s content. The live page only changes when you press Update.</span>
              <button type="button" className={s.btnPrimary} onClick={() => onRestore(open.id)}>Restore this version</button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
