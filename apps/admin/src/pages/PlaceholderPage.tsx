interface Props { title: string }

export default function PlaceholderPage({ title }: Props) {
  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh' }}>
      <header style={{ borderBottom: '2px dashed var(--ink)', paddingBottom: 14, marginBottom: 32 }}>
        <h1 style={{ fontFamily: '"Caveat", cursive', fontWeight: 700, fontSize: 44, margin: 0 }}>
          {title}
        </h1>
      </header>
      <div style={{
        display: 'inline-block', border: '2px dashed var(--rule)',
        padding: '32px 40px', fontFamily: '"Patrick Hand", sans-serif',
        fontSize: 18, color: 'var(--ink-soft)',
      }}>
        <div style={{ fontFamily: '"Caveat", cursive', fontSize: 32, color: 'var(--accent)', marginBottom: 8 }}>
          ✎ Coming soon
        </div>
        <div>{title} will be implemented in a future task.</div>
        <div style={{ marginTop: 12, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          — placeholder —
        </div>
      </div>
    </div>
  )
}
