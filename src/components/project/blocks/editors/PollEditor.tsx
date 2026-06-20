import Toggle from '../../Toggle'
import styles from './editors.module.css'

interface PollData {
  question: string
  options: string[]
  anonymous: boolean
  showResults: boolean
  expiry: string
}

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function PollEditor({ data, onChange }: Props) {
  const d = data as unknown as PollData
  const options: string[] =
    Array.isArray(d.options) && d.options.length >= 2 ? d.options : ['', '']

  function set(patch: Partial<PollData>) {
    onChange({ ...d, ...patch })
  }

  function setOption(i: number, val: string) {
    set({ options: options.map((o, idx) => (idx === i ? val : o)) })
  }

  function addOption() {
    if (options.length >= 4) return
    set({ options: [...options, ''] })
  }

  function removeOption(i: number) {
    if (options.length <= 2) return
    set({ options: options.filter((_, idx) => idx !== i) })
  }

  return (
    <div>
      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>Question</label>
          <input
            className={styles.fi}
            type="text"
            value={d.question}
            placeholder="What do you think about…?"
            onChange={(e) => set({ question: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Options <span className={styles.hint}>2 min · 4 max</span>
          </label>
          <div className={styles.pollOptions}>
            {options.map((opt, i) => (
              <div key={i} className={styles.pollOptRow}>
                <span className={styles.pollOptNum}>{i + 1}.</span>
                <input
                  className={styles.fi}
                  type="text"
                  value={opt}
                  placeholder={`Option ${i + 1}…`}
                  onChange={(e) => setOption(i, e.target.value)}
                />
                <button
                  type="button"
                  className={styles.rmRowBtn}
                  onClick={() => removeOption(i)}
                  disabled={options.length <= 2}
                  title="Remove option"
                >✕</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={styles.addRowBtn}
            onClick={addOption}
            disabled={options.length >= 4}
          >+ add option</button>
        </div>
      </div>

      <div className={styles.pollSettings}>
        <div className={styles.pollSettingsHead}>/// settings</div>
        <Toggle
          label="Anonymous responses"
          subLabel="Don't collect voter identities."
          checked={d.anonymous}
          onChange={(v) => set({ anonymous: v })}
        />
        <Toggle
          label="Show results to voters"
          subLabel="Voters see results immediately after voting."
          checked={d.showResults}
          onChange={(v) => set({ showResults: v })}
        />
        <div className={styles.pollExpiryWrap}>
          <div className={styles.fg}>
            <label className={styles.fl}>
              Expiry date <span className={styles.hint}>optional</span>
            </label>
            <input
              className={styles.fi}
              type="date"
              value={d.expiry}
              onChange={(e) => set({ expiry: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
