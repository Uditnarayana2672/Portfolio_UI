import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getPublicProject, reactToProject } from '../api/publicApi'
import type {
  PublicProject,
  ReactionCounts,
  ReactionType,
} from '../types/publicProject'
import { BlockRenderer, hasEyebrow } from '../components/public/blocks'
import '../styles/projectDetail.css'

const REACTIONS: { key: ReactionType; emoji: string; label: string }[] = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'clap', emoji: '👏', label: 'Clap' },
  { key: 'mind_blown', emoji: '🤯', label: 'Mind blown' },
]

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

// Load the editorial fonts once, only while a public page is mounted.
function useEditorialFonts() {
  useEffect(() => {
    const id = 'pdx-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap'
    document.head.appendChild(link)
  }, [])
}

export default function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  useEditorialFonts()

  const [project, setProject] = useState<PublicProject | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading')
  const [reactions, setReactions] = useState<ReactionCounts>({})
  const [reacted, setReacted] = useState<ReactionType | null>(null)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  // fetch
  useEffect(() => {
    let alive = true
    setStatus('loading')
    getPublicProject(slug)
      .then((p) => {
        if (!alive) return
        setProject(p)
        setReactions(p.reactions || {})
        setStatus('ready')
        if (p.seo?.meta_title || p.title) document.title = `${p.seo?.meta_title || p.title}`
      })
      .catch((e: Error & { status?: number }) => {
        if (!alive) return
        setStatus(e.status === 404 ? 'notfound' : 'error')
      })
    return () => {
      alive = false
    }
  }, [slug])

  // restore which reaction this device already sent
  useEffect(() => {
    try {
      const r = localStorage.getItem(`pf-react-${slug}`)
      if (r) setReacted(r as ReactionType)
    } catch { /* ignore */ }
  }, [slug])

  // reading-progress bar
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setProgress(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // scroll-reveal
  useEffect(() => {
    if (status !== 'ready') return
    const els = rootRef.current?.querySelectorAll('.reveal')
    if (!els?.length) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in')
            io.unobserve(en.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [status])

  const meta = (project?.meta ?? {}) as Record<string, unknown>

  // assign running section numbers (only blocks with an eyebrow are numbered)
  const numbering = useMemo(() => {
    const map = new Map<string, number>()
    let n = 0
    let fig = 0
    const figMap = new Map<string, number>()
    for (const b of project?.blocks ?? []) {
      if (hasEyebrow(b)) {
        n += 1
        map.set(b.id, n)
      }
      if (b.block_type === 'image') {
        fig += 1
        figMap.set(b.id, fig)
      }
    }
    return { map, figMap }
  }, [project])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1800)
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: project?.title, url })
        return
      }
    } catch { /* fall through to copy */ }
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied to clipboard')
    } catch {
      showToast(url)
    }
  }

  const react = async (key: ReactionType) => {
    if (!project) return
    // optimistic
    setReactions((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }))
    setReacted(key)
    try { localStorage.setItem(`pf-react-${slug}`, key) } catch { /* ignore */ }
    try {
      const fresh = await reactToProject(project.slug, key)
      setReactions(fresh)
    } catch {
      showToast('Could not save reaction')
    }
  }

  // ── states ────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="pdx" ref={rootRef}>
        <div className="state"><div className="spinner" /></div>
      </div>
    )
  }
  if (status === 'notfound') {
    return (
      <div className="pdx">
        <div className="state">
          <h1>Project not found</h1>
          <p>This project may be unpublished or the link is wrong.</p>
          <button className="ext-link primary" onClick={() => navigate('/projects')}>
            ← Back to all projects
          </button>
        </div>
      </div>
    )
  }
  if (status === 'error' || !project) {
    return (
      <div className="pdx">
        <div className="state">
          <h1>Something went wrong</h1>
          <p>We couldn't load this project right now.</p>
          <button className="ext-link" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  // Editorial header — flat columns are the source of truth; fall back to the
  // legacy `meta` blob. A value may fold a muted sub-line via "\n" or " · ".
  const splitMeta = (v: string): [string, string] => {
    const parts = v.includes('\n') ? v.split('\n') : v.split(' · ')
    return [parts[0]?.trim() ?? '', parts.slice(1).join(' · ').trim()]
  }
  const kicker = str(project.category) || str(meta.category) || str(meta.kicker)
  const [roleMain, roleSubFlat] = splitMeta(str(project.role) || str(meta.role))
  const roleSub = roleSubFlat || str(meta.role_sub)
  const [timelineMain, timelineSubFlat] = splitMeta(str(project.project_timeline) || str(meta.timeline_label))
  const timelineSub = timelineSubFlat || str(meta.timeline_sub)
  const [statusMain, statusSubFlat] = splitMeta(str(project.display_status) || str(meta.status_label))
  const statusSub = statusSubFlat || str(meta.status_sub)
  const recognition = str(project.recognition) || str(meta.recognition)
  const blocks = project.blocks
  let contentIndex = 0 // for band alternation (skip hero)

  return (
    <div className="pdx" ref={rootRef}>
      <div className="progress" style={{ width: `${progress}%` }} />

      {/* NAV */}
      <header className="nav">
        <div className="wrap nav-in">
          <Link className="brand" to="/projects">
            <span className="mono">UN</span>
            Udit&nbsp;Narayana
          </Link>
          <nav className="nav-links">
            <Link to="/projects">Work</Link>
            <a href="#top">Writing</a>
            <a href="#top">About</a>
            <button className="cta" onClick={share} style={{ border: 'none', cursor: 'pointer' }}>
              Share
            </button>
          </nav>
        </div>
      </header>

      {/* back */}
      <div className="backbar">
        <div className="wrap">
          <button onClick={() => navigate('/projects')}>← All projects</button>
        </div>
      </div>

      {/* HEADER */}
      <section className="wrap phead" id="top">
        {kicker && <div className="kicker">{kicker}</div>}
        <h1>{project.title}</h1>
        {project.excerpt && <p className="lede">{project.excerpt}</p>}

        <div className="meta">
          {roleMain && (
            <div className="m-item">
              <div className="m-label">Role</div>
              <div className="m-val">
                {roleMain}
                {roleSub && <><br /><span className="sub">{roleSub}</span></>}
              </div>
            </div>
          )}
          {timelineMain && (
            <div className="m-item">
              <div className="m-label">Timeline</div>
              <div className="m-val">
                {timelineMain}
                {timelineSub && <><br /><span className="sub">{timelineSub}</span></>}
              </div>
            </div>
          )}
          {statusMain && (
            <div className="m-item">
              <div className="m-label">Status</div>
              <div className="m-val">
                {statusMain}
                {statusSub && <><br /><span className="sub">{statusSub}</span></>}
              </div>
            </div>
          )}
          {(project.demo_url || project.github_url) && (
            <div className="m-item">
              <div className="m-label">Links</div>
              <div className="m-val links-row">
                {project.demo_url && (
                  <a className="ext-link primary" href={project.demo_url} target="_blank" rel="noreferrer">
                    Live demo <span className="arr">↗</span>
                  </a>
                )}
                {project.github_url && (
                  <a className="ext-link" href={project.github_url} target="_blank" rel="noreferrer">
                    GitHub <span className="arr">↗</span>
                  </a>
                )}
              </div>
            </div>
          )}
          {project.tech_stack.length > 0 && (
            <div className="m-item span2">
              <div className="m-label">Stack</div>
              <div className="stack-tags">
                {project.tech_stack.map((t) => (
                  <span className="tag" key={t}>{t}</span>
                ))}
              </div>
            </div>
          )}
          {recognition && (
            <div className="m-item span2">
              <div className="m-label">Recognition</div>
              <div className="m-val">{recognition}</div>
            </div>
          )}
        </div>
      </section>

      {/* BLOCKS */}
      {blocks.map((block) => {
        const isHero = block.block_type === 'hero'
        const banded = !isHero && contentIndex % 2 === 1
        if (!isHero) contentIndex += 1
        const no = numbering.map.get(block.id) ?? null
        const fig = numbering.figMap.get(block.id) ?? 0
        return (
          <section
            className={banded ? 'section band' : 'section'}
            key={block.id}
            style={isHero ? { paddingTop: 0, paddingBottom: 0 } : undefined}
          >
            <div className="wrap reveal">
              <BlockRenderer block={block} no={no} fig={fig} />
            </div>
          </section>
        )
      })}

      {/* REACTIONS */}
      <section className="section band">
        <div className="wrap col reveal" style={{ textAlign: 'center' }}>
          <p className="eyebrow" style={{ justifyContent: 'center' }}>Enjoyed this?</p>
          <div className="reactions" style={{ justifyContent: 'center' }}>
            {REACTIONS.map((r) => (
              <button
                key={r.key}
                className={`react-btn${reacted === r.key ? ' on' : ''}`}
                onClick={() => react(r.key)}
                aria-label={r.label}
              >
                <span className="emoji">{r.emoji}</span>
                <span className="count">{reactions[r.key] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap foot-top">
          <div className="foot-next">
            {project.next_project ? (
              <Link to={`/projects/${project.next_project.slug}`}>
                <div className="fn-lbl">Next project</div>
                <div className="fn-title">
                  {project.next_project.title} <span className="arr">→</span>
                </div>
              </Link>
            ) : project.prev_project ? (
              <Link to={`/projects/${project.prev_project.slug}`}>
                <div className="fn-lbl">Previous project</div>
                <div className="fn-title">
                  {project.prev_project.title} <span className="arr">→</span>
                </div>
              </Link>
            ) : (
              <Link to="/projects">
                <div className="fn-lbl">More</div>
                <div className="fn-title">All projects <span className="arr">→</span></div>
              </Link>
            )}
          </div>
          <div>
            <div className="fn-lbl" style={{ marginBottom: 14 }}>Elsewhere</div>
            <div className="foot-cols" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 40px' }}>
              {project.github_url && <a href={project.github_url} className="ext-link">GitHub</a>}
              <button className="ext-link" onClick={share}>Share this</button>
            </div>
          </div>
        </div>
        <div className="wrap foot-bottom">
          <span>© {new Date().getFullYear()} Udit Narayana</span>
          <span>{project.views} views</span>
          <span className="sig">Built with care in India</span>
        </div>
      </footer>

      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}
