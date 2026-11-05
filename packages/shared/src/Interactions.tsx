// Parts of public pages that talk to the API from the browser.
import { useEffect, useRef, useState } from 'react'
import { ApiError, TURNSTILE_SITE_KEY, api, sessionId } from './api'
import { formatDate } from './text'
import type { BlogCard, PollResult, PublicComment } from './types'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string
      reset: (id?: string) => void
    }
  }
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}

/** Cloudflare's spam check. Renders nothing until a site key is configured. */
function useTurnstile() {
  const ref = useRef<HTMLDivElement>(null)
  const widget = useRef<string | undefined>(undefined)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ref.current) return
    const render = () => {
      if (!window.turnstile || !ref.current || widget.current) return
      widget.current = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(null),
      })
    }
    if (window.turnstile) {
      render()
      return
    }
    const id = 'cf-turnstile'
    let script = document.getElementById(id) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = id
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', render)
    return () => script?.removeEventListener('load', render)
  }, [])

  const reset = () => {
    setToken(null)
    if (window.turnstile) window.turnstile.reset(widget.current)
  }
  return { element: TURNSTILE_SITE_KEY ? <div ref={ref} /> : null, token, reset }
}

function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="hp" aria-hidden="true">
      Website
      <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

// ── poll ─────────────────────────────────────────────────────────────────────

export function Poll({ blockId, question, options }: { blockId: string; question: string; options: string[] }) {
  const [result, setResult] = useState<PollResult | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let current = true
    api.poll(blockId).then((r) => { if (current) setResult(r) }, () => { if (current) setError('Live results are unavailable right now.') })
    return () => { current = false }
  }, [blockId])

  async function vote(index: number) {
    setBusy(true)
    setError('')
    try {
      setResult(await api.vote(blockId, index))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_VOTED') setResult(await api.poll(blockId))
      else setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const voted = result?.my_vote != null
  const closed = result?.status === 'closed'
  const rows = result?.options ?? options.map((label, index) => ({ index, label, votes: null, percent: null }))
  return (
    <div className="poll">
      <h3>{result?.question || question}</h3>
      <div className="meta">
        {closed ? 'Poll closed · ' : ''}
        {result && result.show_results
          ? `${result.total_votes} ${result.total_votes === 1 ? 'vote' : 'votes'}`
          : 'Choose one to see the results'}
      </div>
      {rows.map((o) => (
        <button type="button" key={o.index} className={`poll-opt${result?.my_vote === o.index ? ' mine' : ''}`}
          disabled={!result || voted || closed || busy} onClick={() => vote(o.index)}>
          {o.percent != null && (voted || closed || result?.show_results) && <span className="fill" style={{ width: `${o.percent}%` }} />}
          <span className="lbl">{o.label}</span>
          {o.percent != null && <span className="pct">{o.percent}%</span>}
        </button>
      ))}
      {error && <div className="form-error" role="alert">{error}</div>}
      {voted && <div className="note">Thanks for voting.</div>}
    </div>
  )
}

// ── contact form ─────────────────────────────────────────────────────────────

const TOPICS = ['AI agent', 'Full-stack web product', 'API / backend', 'Rescue a stuck product', 'Something else']

export function ContactForm({ subject, source = 'portfolio_contact', withTopic = true }: {
  subject?: string
  source?: string
  withTopic?: boolean
}) {
  const [fields, setFields] = useState({ name: '', email: '', topic: TOPICS[0], message: '' })
  const [agreed, setAgreed] = useState(false)
  const [website, setWebsite] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const turnstile = useTurnstile()
  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFields({ ...fields, [k]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError('')
    try {
      await api.contact({
        name: fields.name, email: fields.email, subject: subject ?? fields.topic, message: fields.message,
        source, turnstile_token: turnstile.token, website,
      })
      setState('sent')
    } catch (err) {
      setError(err instanceof ApiError && err.status === 422 ? 'Please check your email address and message.' : errorText(err))
      setState('idle')
      turnstile.reset()
    }
  }

  if (state === 'sent') {
    return <div className="ok show" role="status"><b>Message sent.</b><p style={{ marginTop: 8, color: 'var(--ink-2)' }}>Thanks, I’ll get back to you within a day or two.</p></div>
  }
  return (
    <form onSubmit={submit} className="form-grid">
      <div className="two">
        <div className="fld"><label>Your name *<input required maxLength={80} autoComplete="name" value={fields.name} onChange={set('name')} placeholder="Alex Morgan" /></label></div>
        <div className="fld"><label>Email *<input required type="email" autoComplete="email" value={fields.email} onChange={set('email')} placeholder="alex@company.com" /></label></div>
      </div>
      {withTopic && (
        <div className="fld"><label>What are you building? *<select value={fields.topic} onChange={set('topic')}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></label></div>
      )}
      <div className="fld"><label>A little about it *<textarea required maxLength={5000} value={fields.message} onChange={set('message')} placeholder="What problem are you solving? Who is it for?" /></label></div>
      <label className="consent"><input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> I agree that my details may be stored so Udit can reply to this enquiry.</label>
      <Honeypot value={website} onChange={setWebsite} />
      {turnstile.element}
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="btn block" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send message'} <span aria-hidden="true">↗</span></button>
      <div className="safe">Your details stay between us. No marketing sign-up.</div>
    </form>
  )
}

// ── newsletter ───────────────────────────────────────────────────────────────

export function SubscribeForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const turnstile = useTurnstile()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError('')
    try {
      await api.subscribe({ email, turnstile_token: turnstile.token, website })
      setState('sent')
    } catch (err) {
      setError(errorText(err))
      setState('idle')
      turnstile.reset()
    }
  }

  if (state === 'sent') {
    return <p className="sub-done" role="status"><b>Check your inbox.</b> Click the link we sent to finish subscribing.</p>
  }
  return (
    <form onSubmit={submit} className="sub-wrap">
      <div className={dark ? 'sub-form' : 'sub-form light'}>
        <input required type="email" autoComplete="email" aria-label="Email address" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Subscribe'} <span aria-hidden="true">↗</span></button>
      </div>
      <Honeypot value={website} onChange={setWebsite} />
      {turnstile.element}
      {error && <div className="form-error" role="alert">{error}</div>}
    </form>
  )
}

/** Email links land here and wait for a click, because mail scanners open links on their own. */
export function NewsletterAction({ mode }: { mode: 'confirm' | 'unsubscribe' }) {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [token, setToken] = useState<string | null>(null)
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token')) }, [])

  async function run() {
    if (!token) return
    setState('working')
    try {
      await (mode === 'confirm' ? api.confirm(token) : api.unsubscribe(token))
      setState('done')
    } catch (err) {
      setError(errorText(err))
      setState('error')
    }
  }

  if (state === 'done') {
    return <p className="lede" role="status">{mode === 'confirm' ? 'You’re subscribed. New notes will arrive by email.' : 'You’ve been unsubscribed. You won’t get more emails.'}</p>
  }
  return (
    <div className="stack-sm">
      {state === 'error' && <p className="form-error" role="alert">{error}</p>}
      <button className="btn" disabled={!token || state === 'working'} onClick={run}>
        {mode === 'confirm' ? 'Confirm my subscription' : 'Unsubscribe me'} <span aria-hidden="true">↗</span>
      </button>
      {token === null && <p className="note-sm">This page needs the link from your email.</p>}
    </div>
  )
}

// ── comments ─────────────────────────────────────────────────────────────────

function CommentView({ comment, reply }: { comment: PublicComment; reply?: boolean }) {
  return (
    <div className={`cm${reply ? ' rep' : ''}${comment.is_author ? ' me' : ''}`}>
      <div className="av" aria-hidden="true">{comment.author_name[0]?.toUpperCase()}</div>
      <div>
        <header><b>{comment.author_name}</b>{comment.is_author && <em>Author</em>}<span>{formatDate(comment.created_at)}</span></header>
        <p>{comment.content}</p>
      </div>
    </div>
  )
}

export function Comments({ slug, open }: { slug: string; open: boolean }) {
  const [items, setItems] = useState<PublicComment[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [fields, setFields] = useState({ name: '', email: '', content: '' })
  const [website, setWebsite] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const turnstile = useTurnstile()

  useEffect(() => {
    api.comments(slug).then(
      (r) => {
        setItems(r.items)
        setTotal(r.items.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0))
      },
      () => setLoadError(true),
    )
  }, [slug])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError('')
    try {
      await api.addComment(slug, {
        author_name: fields.name, author_email: fields.email || null, content: fields.content,
        turnstile_token: turnstile.token, website,
      })
      setState('sent')
      setFields({ name: '', email: '', content: '' })
    } catch (err) {
      setError(errorText(err))
      setState('idle')
      turnstile.reset()
    }
  }

  return (
    <section className="cmt" id="comments" aria-labelledby="comments-title">
      <h2 id="comments-title">Discussion {total > 0 && <small>{total}</small>}</h2>
      {loadError && <p className="note-sm">Comments couldn’t load right now.</p>}
      {items?.length === 0 && <p className="note-sm">{open ? 'No comments yet. Be the first.' : 'No comments.'}</p>}
      {items?.map((c) => (
        <div key={c.id}>
          <CommentView comment={c} />
          {c.replies?.map((r) => <CommentView key={r.id} comment={r} reply />)}
        </div>
      ))}
      {open ? (
        state === 'sent' ? (
          <p className="form-done" role="status">Thanks! Your comment will appear once it’s been reviewed.</p>
        ) : (
          <form className="cform" onSubmit={submit}>
            <h3>Join the conversation</h3>
            <p className="note">No account needed. Comments are reviewed before they appear. Your email is optional and never shown.</p>
            <div className="two">
              <div className="fld"><label>Name *<input required maxLength={80} autoComplete="name" value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} /></label></div>
              <div className="fld"><label>Email (optional)<input type="email" autoComplete="email" value={fields.email} onChange={(e) => setFields({ ...fields, email: e.target.value })} /></label></div>
            </div>
            <div className="fld"><label>Comment *<textarea required maxLength={2000} value={fields.content} onChange={(e) => setFields({ ...fields, content: e.target.value })} /></label></div>
            <Honeypot value={website} onChange={setWebsite} />
            {turnstile.element}
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Posting…' : 'Post comment'} <span aria-hidden="true">↗</span></button>
          </form>
        )
      ) : <p className="note-sm">Comments are closed on this post.</p>}
    </section>
  )
}

// ── reactions and live counts ────────────────────────────────────────────────

const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'clap', emoji: '👏', label: 'Clap' },
  { key: 'mind_blown', emoji: '🤯', label: 'Mind blown' },
]

function remembered(key: string): boolean {
  try { return localStorage.getItem(key) === '1' } catch { return false }
}

export function Reactions({ kind, slug }: { kind: 'project' | 'blog'; slug: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const storageKey = (r: string) => `lh-react-${kind}-${slug}-${r}`
  const [mine, setMine] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = kind === 'project' ? api.projectEngagement(slug) : api.blogEngagement(slug)
    load.then((r) => setCounts(r.reactions), () => undefined)
    const view = kind === 'project' ? api.projectView(slug) : api.blogView(slug)
    view.catch(() => undefined)
    setMine(Object.fromEntries(REACTIONS.map((r) => [r.key, remembered(storageKey(r.key))])))
    void sessionId()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, slug])

  async function react(key: string) {
    if (mine[key]) return
    setMine({ ...mine, [key]: true })
    setCounts({ ...counts, [key]: (counts[key] ?? 0) + 1 })
    try { localStorage.setItem(storageKey(key), '1') } catch { /* private window */ }
    try {
      const r = await (kind === 'project' ? api.projectReact(slug, key) : api.blogReact(slug, key))
      setCounts(r.reactions)
    } catch { /* the count corrects itself on the next visit */ }
  }

  return (
    <div className="reactions" role="group" aria-label="React">
      {REACTIONS.map((r) => (
        <button type="button" key={r.key} className={mine[r.key] ? 'on' : ''} aria-pressed={!!mine[r.key]} aria-label={r.label} onClick={() => react(r.key)}>
          <span aria-hidden="true">{r.emoji}</span>{(counts[r.key] ?? 0) > 0 && <b>{counts[r.key]}</b>}
        </button>
      ))}
    </div>
  )
}

// ── searchable post list ─────────────────────────────────────────────────────

export function PostCard({ post }: { post: BlogCard }) {
  return (
    <a className="post" href={`/blog/${post.slug}`}>
      {post.cover?.url ? (
        <div className="pcover has-img"><img className="tone" src={post.cover.url} alt={post.cover.alt || ''} loading="lazy" /></div>
      ) : (
        <div className="pcover"><span className="g">{(post.category?.name ?? post.title).slice(0, 3).toUpperCase()}<small>.</small></span></div>
      )}
      <div className="pbody">
        <div className="k">{post.category?.name ?? 'Note'}<i>{post.reading_time_min} min</i></div>
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <span className="more">Read note →</span>
      </div>
    </a>
  )
}

export function PostBrowser({ initial, total: initialTotal, category, tag }: {
  initial: BlogCard[]
  total: number
  category?: string
  tag?: string
}) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState(initial)
  const [total, setTotal] = useState(initialTotal)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const first = useRef(true)

  const params = (q: string, offset: number) => {
    const p = new URLSearchParams({ limit: '12', offset: String(offset) })
    if (q) p.set('q', q)
    if (category) p.set('category', category)
    if (tag) p.set('tag', tag)
    return `?${p}`
  }

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const timer = setTimeout(() => {
      setBusy(true)
      setError('')
      api.blogs(params(query.trim(), 0)).then(
        (r) => { setItems(r.items); setTotal(r.total) },
        (err) => setError(errorText(err)),
      ).finally(() => setBusy(false))
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  async function more() {
    setBusy(true)
    try {
      const r = await api.blogs(params(query.trim(), items.length))
      setItems([...items, ...r.items])
      setTotal(r.total)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <label className="search">
        <span aria-hidden="true">⌕</span>
        <input type="search" placeholder="Search notes…" aria-label="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="posts" aria-busy={busy}>{items.map((p) => <PostCard key={p.slug} post={p} />)}</div>
      {!busy && items.length === 0 && <p className="empty-note">{query ? `No notes match “${query}”.` : 'No notes here yet.'}</p>}
      {items.length < total && (
        <div className="center-row"><button className="btn btn-outline" disabled={busy} onClick={more}>{busy ? 'Loading…' : 'Load more notes'}</button></div>
      )}
    </>
  )
}
