import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MiniStat from '../stats/MiniStat'
import { getBlogStats } from '../../api/blogApi'
import { getMediaStats } from '../../api/mediaApi'
import { getRecentActivity } from '../../api/portfolioApi'
import { getStatusCounts } from '../../api/projectApi'
import type { ActivityItem } from '../../types/portfolio'
import styles from './CommandDeck.module.css'

type Load<T> = { state: 'loading' } | { state: 'error' } | { state: 'ready'; data: T }

/** One independent request, so a failed tile never blanks the rest of the page. */
function useLoad<T>(fetcher: () => Promise<T>): [Load<T>, () => void] {
  const [load, setLoad] = useState<Load<T>>({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    fetcher().then(
      (data) => { if (current) setLoad({ state: 'ready', data }) },
      () => { if (current) setLoad({ state: 'error' }) },
    )
    return () => { current = false }
  }, [fetcher, attempt])

  const retry = useCallback(() => {
    setLoad({ state: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return [load, retry]
}

const fetchActivity = () => getRecentActivity(20).then((r) => r.items)

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function Tile<T>({ label, load, retry, to, children }: {
  label: string
  load: Load<T>
  retry: () => void
  to: string
  children: (data: T) => React.ReactNode
}) {
  if (load.state === 'loading') return <MiniStat label={label} num="…" sub="Loading" />
  if (load.state === 'error') {
    return (
      <div className={styles.tileError} role="alert">
        <div className={styles.errorLabel}>{label}</div>
        <div>Couldn’t load this.</div>
        <button className={styles.retry} onClick={retry}>Retry</button>
      </div>
    )
  }
  return <Link to={to} className={styles.tileLink}>{children(load.data)}</Link>
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const body = (
    <>
      <time className={styles.time} dateTime={item.created_at}>{formatTime(item.created_at)}</time>
      <span className={`${styles.tag} ${styles[item.category]}`}>{item.category}</span>
      <span className={styles.desc}>{item.description}</span>
      {item.actor === 'system' && <span className={styles.system}>system</span>}
    </>
  )
  return (
    <li>
      {item.link
        ? <Link className={styles.row} to={item.link}>{body}</Link>
        : <div className={styles.row}>{body}</div>}
    </li>
  )
}

export default function CommandDeck() {
  const [projects, retryProjects] = useLoad(getStatusCounts)
  const [blogs, retryBlogs] = useLoad(getBlogStats)
  const [media, retryMedia] = useLoad(getMediaStats)
  const [activity, retryActivity] = useLoad(fetchActivity)

  return (
    <section aria-labelledby="deck-title">
      <h2 id="deck-title" className={styles.title}>Command deck</h2>

      <div className={styles.tiles}>
        <Tile label="Projects published" load={projects} retry={retryProjects} to="/admin/projects">
          {(c) => <MiniStat label="Projects published" num={c.published} sub={`${plural(c.draft, 'draft')} · ${c.archived} archived`} />}
        </Tile>
        <Tile label="Blogs published" load={blogs} retry={retryBlogs} to="/admin/blogs">
          {(b) => (
            <MiniStat
              label="Blogs published"
              num={b.published}
              sub={b.failed_schedules > 0
                ? `${plural(b.failed_schedules, 'schedule')} failed`
                : `${plural(b.draft, 'draft')} · ${b.scheduled} scheduled · ${b.archived} archived`}
              subVariant={b.failed_schedules > 0 ? 'warn' : undefined}
            />
          )}
        </Tile>
        <Tile label="Media" load={media} retry={retryMedia} to="/admin/media">
          {(m) => (
            <MiniStat
              label="Media"
              num={m.total_assets}
              sub={`${m.added_today} today · ${plural(m.counts.image ?? 0, 'image')} · ${plural(m.counts.video ?? 0, 'video')}`}
            />
          )}
        </Tile>
        <Tile label="Storage" load={media} retry={retryMedia} to="/admin/media">
          {(m) => (
            <MiniStat
              label="Storage"
              variant="storage"
              num={m.storage.percent_used === 0 && m.storage.used_bytes > 0 ? '<1%' : `${m.storage.percent_used}%`}
              sub={`${m.storage.used_human} of ${m.storage.quota_human} · ${m.storage.plan}`}
              storagePercent={Math.min(m.storage.percent_used, 100)}
            />
          )}
        </Tile>
      </div>

      <div className={styles.lower}>
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Recent activity</h3>
          {activity.state === 'loading' && <p className={styles.note}>Loading…</p>}
          {activity.state === 'error' && (
            <p className={styles.note} role="alert">
              Couldn’t load activity. <button className={styles.retry} onClick={retryActivity}>Retry</button>
            </p>
          )}
          {activity.state === 'ready' && activity.data.length === 0 && <p className={styles.note}>Nothing yet.</p>}
          {activity.state === 'ready' && activity.data.length > 0 && (
            <ul className={styles.stream}>
              {activity.data.map((item) => <ActivityRow key={item.id} item={item} />)}
            </ul>
          )}
        </div>
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Quick create</h3>
          <div className={styles.quick}>
            <Link to="/admin/projects/new" className={styles.quickItem}>+ New project</Link>
            <Link to="/admin/blogs/new" className={styles.quickItem}>+ New blog post</Link>
            <Link to="/admin/media" className={styles.quickItem}>+ Upload media</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
