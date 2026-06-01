import { useState } from 'react'
import { useUiStore } from '../../store/uiStore'
import type { GridDensity } from '../../store/uiStore'

const ACCENT_SWATCHES = ['#c1432a', '#2a5fa3', '#3d7a3a', '#7a3aa6', '#21201c']
const PAPER_SWATCHES  = ['#f5f1e8', '#ffffff', '#ede4cf', '#e6e4dd']
const DENSITY_OPTIONS: { label: string; value: GridDensity }[] = [
  { label: 'Dense', value: 'dense' },
  { label: 'Comfy', value: 'comfy' },
  { label: 'Roomy', value: 'roomy' },
]

export default function TweaksPanel() {
  const [open, setOpen] = useState(false)

  const accentColor   = useUiStore((s) => s.accentColor)
  const paperColor    = useUiStore((s) => s.paperColor)
  const wobbleEnabled = useUiStore((s) => s.wobbleEnabled)
  const gridDensity   = useUiStore((s) => s.gridDensity)

  const setAccentColor   = useUiStore((s) => s.setAccentColor)
  const setPaperColor    = useUiStore((s) => s.setPaperColor)
  const setWobbleEnabled = useUiStore((s) => s.setWobbleEnabled)
  const setGridDensity   = useUiStore((s) => s.setGridDensity)

  const btnStyle: React.CSSProperties = {
    fontFamily: '"Caveat", cursive',
    fontSize: 20,
    border: '2px solid #21201c',
    background: 'var(--paper, #f5f1e8)',
    padding: '8px 16px',
    cursor: 'pointer',
    color: '#21201c',
    transition: 'transform .12s, box-shadow .12s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  }

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100 }}>
      <button
        style={btnStyle}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translate(-2px,-2px)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '3px 3px 0 #21201c'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = ''
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = ''
        }}
        onClick={() => setOpen((v) => !v)}
      >
        ⚙ Tweaks
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 8,
            width: 220,
            padding: 16,
            border: '2px dashed #21201c',
            background: 'var(--paper, #f5f1e8)',
            fontFamily: '"Caveat", cursive',
            fontSize: 17,
            color: '#21201c',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Accent color */}
          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Accent</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {ACCENT_SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  title={c}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: c,
                    border: accentColor === c ? '2px solid #21201c' : '2px solid transparent',
                    transform: accentColor === c ? 'scale(1.2)' : 'scale(1)',
                    cursor: 'pointer',
                    transition: 'transform .12s, border-color .12s',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Paper color */}
          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Paper</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {PAPER_SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => setPaperColor(c)}
                  title={c}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: c,
                    border: paperColor === c ? '2px solid #21201c' : '2px solid #9b9789',
                    transform: paperColor === c ? 'scale(1.2)' : 'scale(1)',
                    cursor: 'pointer',
                    transition: 'transform .12s, border-color .12s',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Wobble toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={wobbleEnabled}
              onChange={(e) => setWobbleEnabled(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            Ink wobble
          </label>

          {/* Grid density */}
          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Grid density</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {DENSITY_OPTIONS.map(({ label, value }) => (
                <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tweaks-density"
                    checked={gridDensity === value}
                    onChange={() => setGridDensity(value)}
                    style={{ cursor: 'pointer' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
