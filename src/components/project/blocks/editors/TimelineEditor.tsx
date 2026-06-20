import styles from './editors.module.css'

interface TimelineEntry { date: string; title: string; description: string }
interface TimelineData { entries: TimelineEntry[] }

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function TimelineEditor({ data, onChange }: Props) {
  const d = data as unknown as TimelineData
  const entries: TimelineEntry[] =
    Array.isArray(d.entries) && d.entries.length > 0
      ? d.entries
      : [{ date: '', title: '', description: '' }]

  function set(patch: Partial<TimelineData>) {
    onChange({ ...d, ...patch })
  }

  function setEntry(i: number, patch: Partial<TimelineEntry>) {
    set({ entries: entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) })
  }

  function addEntry() {
    if (entries.length >= 8) return
    set({ entries: [...entries, { date: '', title: '', description: '' }] })
  }

  function removeEntry(i: number) {
    if (entries.length <= 1) return
    set({ entries: entries.filter((_, idx) => idx !== i) })
  }

  return (
    <div>
      <div className={styles.edRow}>
        <label className={styles.fl}>
          Timeline entries <span className={styles.hint}>max 8 · oldest first</span>
        </label>
      </div>

      <div className={styles.tlEntries}>
        {entries.map((e, i) => (
          <div key={i} className={styles.tlEntry}>
            <div className={styles.fg}>
              <label className={styles.flTiny}>Date / period</label>
              <input
                className={styles.fi}
                type="text"
                value={e.date}
                placeholder="e.g. Mar 2024"
                onChange={(ev) => setEntry(i, { date: ev.target.value })}
              />
            </div>
            <div className={styles.tlEntryMain}>
              <div className={styles.fg}>
                <label className={styles.flTiny}>Title</label>
                <input
                  className={styles.fi}
                  type="text"
                  value={e.title}
                  placeholder="Milestone title"
                  onChange={(ev) => setEntry(i, { title: ev.target.value })}
                />
              </div>
              <div className={styles.fg}>
                <label className={styles.flTiny}>
                  Description <span className={styles.hint}>optional</span>
                </label>
                <input
                  className={styles.fi}
                  type="text"
                  value={e.description}
                  placeholder="One-line description…"
                  onChange={(ev) => setEntry(i, { description: ev.target.value })}
                />
              </div>
            </div>
            <button
              type="button"
              className={styles.rmRowBtn}
              onClick={() => removeEntry(i)}
              disabled={entries.length <= 1}
              title="Remove entry"
            >✕</button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={styles.addRowBtn}
        onClick={addEntry}
        disabled={entries.length >= 8}
      >+ add entry</button>
    </div>
  )
}
