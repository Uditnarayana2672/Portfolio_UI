import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Method = 'password' | 'magic'

function mapAuthError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid email or password'))
    return 'Incorrect email or password. Please try again.'
  if (m.includes('email not confirmed'))
    return 'Please verify your email before signing in. Check your inbox.'
  if (m.includes('user not found'))
    return 'No account found with that email address.'
  if (m.includes('too many requests') || m.includes('rate limit'))
    return 'Too many attempts. Please wait a moment before trying again.'
  if (m.includes('network') || m.includes('fetch'))
    return 'Network error. Check your connection and try again.'
  if (m.includes('signup') && m.includes('disabled'))
    return 'Sign-ups are currently disabled. Contact the administrator.'
  return msg
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [method, setMethod] = useState<Method>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  function clearError() { if (error) setError(null) }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (method === 'password') {
        const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
        if (authErr) throw authErr
        navigate('/media')
      } else {
        const { error: authErr } = await supabase.auth.signInWithOtp({ email })
        if (authErr) throw authErr
        setMagicSent(true)
      }
    } catch (err: unknown) {
      setError(mapAuthError(err instanceof Error ? err.message : 'Authentication failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '28px 32px 80px' }}>
      {/* Page header */}
      <header style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        borderBottom: '1.5px dashed var(--ink)', paddingBottom: 14, marginBottom: 22,
      }}>
        <div>
          <h1 style={{ fontFamily: '"Caveat", cursive', fontWeight: 700, fontSize: 40, margin: 0 }}>
            Sign in <span style={{ color: 'var(--accent)' }}>/ Light House</span>
          </h1>
          <div style={{ fontFamily: '"Patrick Hand", sans-serif', color: 'var(--ink-soft)', fontSize: 15, marginTop: 4 }}>
            Admin portal — use your work email.
          </div>
        </div>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--ink-soft)', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          Auth § 1.0<br />v0.1 — 2026
        </div>
      </header>

      {/* Notebook two-column stage */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.05fr 1fr',
        border: '1.5px solid var(--ink)', background: 'var(--paper)',
        boxShadow: '6px 6px 0 rgba(33,32,28,.1)', minHeight: 520,
      }}>

        {/* LEFT — welcome page */}
        <div style={{
          position: 'relative', padding: '40px 44px 36px 64px',
          background: 'repeating-linear-gradient(to bottom, transparent 0 31px, rgba(33,32,28,.07) 31px 32px), var(--paper)',
          borderRight: '1.5px dashed var(--ink)',
        }}>
          {/* Red margin line */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 44, width: 1, background: 'var(--accent)', opacity: 0.55 }} />

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, border: '1.5px solid var(--ink)', background: 'var(--paper)', display: 'grid', placeItems: 'center', position: 'relative' }}>
              <span style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', top: 6 }} />
              <span style={{ width: 10, height: 16, background: 'var(--ink)', marginTop: 8, display: 'block' }} />
            </div>
            <div>
              <div style={{ fontFamily: '"Caveat", cursive', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                Light House<span style={{ color: 'var(--accent)' }}>.</span>
              </div>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--ink-soft)', marginTop: 4 }}>
                /// for builders of agents
              </div>
            </div>
          </div>

          <h2 style={{ fontFamily: '"Caveat", cursive', fontWeight: 700, fontSize: 52, margin: '18px 0 2px', lineHeight: 1.05 }}>
            Welcome to{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              Light&nbsp;House
              <span style={{ position: 'absolute', left: '-2%', right: '-2%', bottom: -4, height: 6, background: 'var(--accent)', opacity: 0.4, borderRadius: 3, transform: 'skewX(-8deg)', display: 'block' }} />
            </span>
          </h2>

          <p style={{ fontFamily: '"Patrick Hand", sans-serif', fontSize: 18, color: 'var(--ink-soft)', margin: '18px 0 26px', maxWidth: 380 }}>
            A workshop for AI engineers — projects, notes, and a brand-tuned assistant that keeps shipping when you're asleep.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { check: '✓', title: 'Pick up where you left off', sub: '23 projects · 12 unread notes' },
              { check: '✓', title: 'Jerry handled 47 conversations today', sub: '2 escalations · 3 bookings · 12 notes' },
              { check: '✓', title: 'Build with the SDK, ship the UI', sub: 'python · typescript · go' },
            ].map((item) => (
              <li key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', fontFamily: '"Patrick Hand", sans-serif', fontSize: 17, lineHeight: 1.35 }}>
                <span style={{ width: 22, height: 22, border: '1.5px solid var(--ink)', display: 'grid', placeItems: 'center', fontFamily: '"Caveat", cursive', fontWeight: 700, color: 'var(--accent)', fontSize: 18, flexShrink: 0 }}>
                  {item.check}
                </span>
                <div>
                  <strong style={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: 15 }}>{item.title}</strong>
                  <small style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--ink-faint)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                    {item.sub}
                  </small>
                </div>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 28, fontFamily: '"Caveat", cursive', color: 'var(--accent)', fontSize: 22, transform: 'rotate(-1deg)', display: 'inline-block' }}>
            ✎ no password? click "magic link" →
          </div>
        </div>

        {/* RIGHT — form */}
        <div style={{ padding: '40px 44px 36px', position: 'relative' }}>
          {/* Method toggle */}
          <div style={{ display: 'flex', border: '1.5px solid var(--ink)', marginBottom: 22, background: 'var(--paper-dark)' }}>
            {(['password', 'magic'] as Method[]).map((m) => (
              <button key={m} onClick={() => { setMethod(m); setError(null) }} style={{
                flex: 1, background: method === m ? 'var(--ink)' : 'transparent',
                border: 'none', padding: '11px 12px', cursor: 'pointer',
                fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '2px',
                color: method === m ? 'var(--paper)' : 'var(--ink-soft)',
                borderRight: m === 'password' ? '1.5px solid var(--ink)' : 'none',
              }}>
                {m === 'password' ? 'Password' : 'Magic link'}
              </button>
            ))}
          </div>

          {magicSent ? (
            <div style={{ padding: '24px 0', fontFamily: '"Patrick Hand", sans-serif', fontSize: 18, color: 'var(--ink-soft)' }}>
              <div style={{ fontFamily: '"Caveat", cursive', fontSize: 32, color: 'var(--ok)', marginBottom: 8 }}>✓ Magic link sent!</div>
              Check your email at <strong>{email}</strong>. The link expires in 10 minutes.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: '"Caveat", cursive', fontSize: 22, fontWeight: 700 }}>email</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--ink-faint)' }}>required</span>
                </div>
                <input
                  type="email" required
                  placeholder="you@studio.dev"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError() }}
                  style={{
                    font: 'inherit', fontFamily: '"JetBrains Mono", monospace', fontSize: 15,
                    padding: '13px 14px', border: `1.5px solid ${error ? 'var(--accent)' : 'var(--ink)'}`,
                    background: 'var(--paper)', color: 'var(--ink)', outline: 'none',
                  }}
                />
              </div>

              {/* Password field */}
              {method === 'password' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: '"Caveat", cursive', fontSize: 22, fontWeight: 700 }}>password</span>
                    <a href="#" style={{ fontFamily: '"Caveat", cursive', fontSize: 17, color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px dashed var(--accent)' }}>
                      forgot?
                    </a>
                  </div>
                  <input
                    type="password" required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError() }}
                    style={{
                      font: 'inherit', fontFamily: '"JetBrains Mono", monospace', fontSize: 15,
                      padding: '13px 14px', border: `1.5px solid ${error ? 'var(--accent)' : 'var(--ink)'}`,
                      background: 'var(--paper)', color: 'var(--ink)', outline: 'none',
                    }}
                  />
                </div>
              )}

              {/* Magic link hint */}
              {method === 'magic' && (
                <div style={{ fontFamily: '"Patrick Hand", sans-serif', fontSize: 14, color: 'var(--ink-soft)' }}>
                  We'll email you a one-tap sign-in link. No password to remember. Link expires in 10 minutes.
                </div>
              )}

              {/* Error */}
              {error && (
                <div role="alert" style={{ padding: '10px 14px', border: '1.5px solid var(--accent)', background: 'var(--accent-soft)', fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ flexShrink: 0 }}>✕</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} style={{
                marginTop: 8, fontFamily: '"JetBrains Mono", monospace', fontSize: 13,
                textTransform: 'uppercase', letterSpacing: '2px',
                background: 'var(--ink)', color: 'var(--paper)',
                border: '1.5px solid var(--ink)', padding: '16px 18px',
                cursor: loading ? 'wait' : 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                opacity: loading ? 0.7 : 1,
              }}>
                <span>{loading ? 'Signing in…' : method === 'password' ? 'Sign in' : 'Send magic link'}</span>
                <span style={{ fontSize: 10, border: '1px solid var(--paper)', padding: '2px 6px', borderRadius: 2, opacity: 0.7 }}>↵</span>
              </button>
            </form>
          )}

          <div style={{
            marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: '"Patrick Hand", sans-serif', fontSize: 15, color: 'var(--ink-soft)',
            paddingTop: 14, borderTop: '1px dashed var(--rule)',
          }}>
            <span>New to Light House? <a href="#" style={{ color: 'var(--ink)', borderBottom: '1px dashed var(--ink)', textDecoration: 'none' }}>request access</a></span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              SOC 2 · TLS 1.3
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 36, fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '2px', borderTop: '1px dashed var(--rule)', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
        <span>Spec § 1.0 — Auth / Sign in</span>
        <span>Light House v0.1</span>
      </div>
    </div>
  )
}
