import { useCallback, useEffect, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import {
  deleteComment, deleteMessage, deleteSubscriber, listComments, listMessages, listSubscribers,
  replyToComment, setCommentStatus, setMessageRead,
} from '../api/portfolioApi'
import { useUiStore } from '../store/uiStore'
import type { AdminComment, AdminMessage, AdminSubscriber } from '../types/portfolio'
import shell from './OverviewPage.module.css'
import styles from './InboxPages.module.css'

const time = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

function Shell({ active, title, sub, children }: { active: string; title: string; sub: string; children: React.ReactNode }) {
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)
  return (
    <div className={shell.page}>
      <header className={shell.pagehead}>
        <button className={shell.menuBtn} onClick={() => setMobileNavOpen(true)} aria-label="Open menu">☰</button>
        <h1>{title} <span className={shell.scribble}>/ {sub}</span></h1>
      </header>
      <div className={shell.layout}>
        <Sidebar activeItem={active} />
        <main className={shell.main}>{children}</main>
      </div>
    </div>
  )
}

function Filters({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.filters} role="group" aria-label="Filter">
      {options.map(([v, label]) => (
        <button key={v} type="button" aria-pressed={v === value} className={v === value ? styles.on : ''} onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  )
}

/** Loads a list, and lets actions refresh it. */
function useList<T>(load: (filter: string) => Promise<{ items: T[]; total: number }>, filter: string) {
  const [items, setItems] = useState<T[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    load(filter).then(
      (r) => { if (current) { setItems(r.items); setError(false) } },
      () => { if (current) setError(true) },
    )
    return () => { current = false }
  }, [load, filter, attempt])
  const refresh = useCallback(() => setAttempt((n) => n + 1), [])
  return { items, error, refresh }
}

function ListState({ items, error, refresh, empty }: { items: unknown[] | null; error: boolean; refresh: () => void; empty: string }) {
  if (error) return <p className={styles.note} role="alert">This couldn’t load. <button className={styles.small} onClick={refresh}>Retry</button></p>
  if (items === null) return <p className={styles.note}>Loading…</p>
  if (items.length === 0) return <p className={styles.note}>{empty}</p>
  return null
}

export function InboxPage() {
  const [filter, setFilter] = useState('all')
  const { items, error, refresh } = useList<AdminMessage>(listMessages, filter)
  const [actionError, setActionError] = useState('')
  const act = (fn: () => Promise<unknown>) => {
    setActionError('')
    fn().then(refresh, () => setActionError('That didn’t work. Try again.'))
  }
  return (
    <Shell active="Inbox" title="Inbox" sub="Messages">
      <section>
        <Filters options={[['all', 'All'], ['unread', 'Unread'], ['read', 'Read']]} value={filter} onChange={setFilter} />
        {actionError && <p className={styles.error} role="alert">{actionError}</p>}
        <ListState items={items} error={error} refresh={refresh} empty="No messages here." />
        {items?.map((m) => (
          <article key={m.id} className={`${styles.card}${m.read ? '' : ` ${styles.unread}`}`}>
            <header><b>{m.name}</b><a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>{m.email}</a><time>{time(m.created_at)}</time></header>
            <h2>{m.subject}</h2>
            <p>{m.message}</p>
            <div className={styles.actions}>
              <a className={styles.small} href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>Reply by email</a>
              <button className={styles.small} onClick={() => act(() => setMessageRead(m.id, !m.read))}>{m.read ? 'Mark unread' : 'Mark read'}</button>
              <button className={`${styles.small} ${styles.danger}`} onClick={() => { if (window.confirm('Delete this message?')) act(() => deleteMessage(m.id)) }}>Delete</button>
            </div>
          </article>
        ))}
      </section>
    </Shell>
  )
}

function CommentCard({ comment, onDone, onError }: { comment: AdminComment; onDone: () => void; onError: (m: string) => void }) {
  const [replying, setReplying] = useState(false)
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const act = (fn: () => Promise<unknown>) => {
    setBusy(true)
    onError('')
    fn().then(onDone, () => onError('That didn’t work. Try again.')).finally(() => setBusy(false))
  }
  return (
    <article className={`${styles.card}${comment.status === 'pending' ? ` ${styles.unread}` : ''}`}>
      <header><b>{comment.author_name}</b>{comment.author_email && <a href={`mailto:${comment.author_email}`}>{comment.author_email}</a>}<time>{time(comment.created_at)}</time></header>
      <h2>On “{comment.post.title}”{comment.parent_id ? ' (reply)' : ''}</h2>
      <p>{comment.content}</p>
      <div className={styles.actions}>
        {comment.status === 'pending'
          ? <button className={styles.small} disabled={busy} onClick={() => act(() => setCommentStatus(comment.id, 'approved'))}>Approve</button>
          : <button className={styles.small} disabled={busy} onClick={() => act(() => setCommentStatus(comment.id, 'pending'))}>Hide</button>}
        <button className={styles.small} onClick={() => setReplying(!replying)}>Reply</button>
        <button className={`${styles.small} ${styles.danger}`} disabled={busy} onClick={() => { if (window.confirm('Delete this comment and its replies?')) act(() => deleteComment(comment.id)) }}>Delete</button>
      </div>
      {replying && (
        <form
          className={styles.reply}
          onSubmit={(e) => {
            e.preventDefault()
            act(() => replyToComment(comment.id, reply).then(() => { setReply(''); setReplying(false) }))
          }}
        >
          <label>Your public reply<textarea required maxLength={2000} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} /></label>
          <button className={styles.small} disabled={busy}>Post reply</button>
        </form>
      )}
    </article>
  )
}

export function CommentsPage() {
  const [filter, setFilter] = useState('pending')
  const { items, error, refresh } = useList<AdminComment>(listComments, filter)
  const [actionError, setActionError] = useState('')
  return (
    <Shell active="Comments" title="Comments" sub="Moderation">
      <section>
        <Filters options={[['pending', 'To review'], ['approved', 'Approved'], ['all', 'All']]} value={filter} onChange={setFilter} />
        {actionError && <p className={styles.error} role="alert">{actionError}</p>}
        <ListState items={items} error={error} refresh={refresh} empty={filter === 'pending' ? 'Nothing to review.' : 'No comments here.'} />
        {items?.map((c) => <CommentCard key={c.id} comment={c} onDone={refresh} onError={setActionError} />)}
      </section>
    </Shell>
  )
}

export function SubscribersPage() {
  const [filter, setFilter] = useState('active')
  const { items, error, refresh } = useList<AdminSubscriber>(listSubscribers, filter)
  const [actionError, setActionError] = useState('')
  return (
    <Shell active="Subscribers" title="Subscribers" sub="Newsletter">
      <section>
        <Filters options={[['active', 'Confirmed'], ['pending', 'Awaiting confirmation'], ['unsubscribed', 'Unsubscribed'], ['all', 'All']]} value={filter} onChange={setFilter} />
        {actionError && <p className={styles.error} role="alert">{actionError}</p>}
        <ListState items={items} error={error} refresh={refresh} empty="No subscribers here." />
        {items && items.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Email</th><th>Status</th><th>Subscribed</th><th><span className={styles.sr}>Actions</span></th></tr></thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>{s.email}</td><td>{s.status}</td><td>{time(s.subscribed_at)}</td>
                    <td><button className={`${styles.small} ${styles.danger}`} onClick={() => {
                      if (!window.confirm(`Remove ${s.email}?`)) return
                      setActionError('')
                      deleteSubscriber(s.id).then(refresh, () => setActionError('That didn’t work. Try again.'))
                    }}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Shell>
  )
}
