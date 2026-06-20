import styles from './editors.module.css'

interface MetricItem { value: string; label: string }
interface StatsData { metrics: MetricItem[] }

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function StatsEditor({ data, onChange }: Props) {
  const d = data as unknown as StatsData
  const metrics: MetricItem[] =
    Array.isArray(d.metrics) && d.metrics.length > 0
      ? d.metrics
      : [{ value: '', label: '' }, { value: '', label: '' }]

  function set(patch: Partial<StatsData>) {
    onChange({ ...d, ...patch })
  }

  function setMetric(i: number, patch: Partial<MetricItem>) {
    set({ metrics: metrics.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) })
  }

  function addMetric() {
    if (metrics.length >= 6) return
    set({ metrics: [...metrics, { value: '', label: '' }] })
  }

  function removeMetric(i: number) {
    if (metrics.length <= 1) return
    set({ metrics: metrics.filter((_, idx) => idx !== i) })
  }

  return (
    <div>
      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Metrics <span className={styles.hint}>up to 6</span>
          </label>
          <div className={styles.statsMetricRows}>
            {metrics.map((m, i) => (
              <div key={i} className={styles.statsMetricRow}>
                <div className={styles.fg}>
                  <label className={styles.flTiny}>Value</label>
                  <input
                    className={styles.fi}
                    type="text"
                    value={m.value}
                    placeholder="e.g. 99%"
                    onChange={(e) => setMetric(i, { value: e.target.value })}
                  />
                </div>
                <div className={styles.fg}>
                  <label className={styles.flTiny}>Label</label>
                  <input
                    className={styles.fi}
                    type="text"
                    value={m.label}
                    placeholder="e.g. Uptime"
                    onChange={(e) => setMetric(i, { label: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className={styles.rmRowBtn}
                  onClick={() => removeMetric(i)}
                  disabled={metrics.length <= 1}
                  title="Remove"
                >✕</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={styles.addRowBtn}
            onClick={addMetric}
            disabled={metrics.length >= 6}
          >+ add metric</button>
        </div>
      </div>

      <div className={styles.statsPreviewHead}>Live preview</div>
      <div className={styles.statsPreviewStrip}>
        {metrics.length === 0 ? (
          <span className={styles.statsEmpty}>No metrics yet.</span>
        ) : (
          metrics.map((m, i) => (
            <div
              key={i}
              className={`${styles.statCard} ${!m.value && !m.label ? styles.emptyMetric : ''}`}
            >
              <div className={styles.sv}>{m.value || '—'}</div>
              <div className={styles.sl}>{m.label || 'label'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
