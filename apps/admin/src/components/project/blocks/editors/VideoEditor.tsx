import UploadZone from '../../UploadZone'
import Toggle from '../../Toggle'
import SegControl from '../../SegControl'
import styles from './editors.module.css'

interface VideoData {
  tab: string
  embedUrl: string
  caption: string
  autoplay: boolean
}

const TAB_OPTS = [
  { value: 'embed',  label: 'Embed URL' },
  { value: 'upload', label: 'Upload MP4' },
]

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function VideoEditor({ data, onChange }: Props) {
  const d = data as unknown as VideoData
  function set(patch: Partial<VideoData>) {
    onChange({ ...d, ...patch })
  }

  return (
    <div>
      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>Source</label>
          <SegControl
            options={TAB_OPTS}
            value={d.tab}
            onChange={(v) => set({ tab: v })}
          />
        </div>
      </div>

      {d.tab === 'embed' && (
        <div className={styles.edRow}>
          <div className={styles.fg}>
            <label className={styles.fl}>YouTube / Vimeo URL</label>
            <input
              className={styles.fi}
              type="text"
              value={d.embedUrl}
              placeholder="https://youtube.com/watch?v=… or https://vimeo.com/…"
              onChange={(e) => set({ embedUrl: e.target.value })}
            />
            <div className={styles.videoPrev169}>
              <div className={styles.vpInner}>
                <span className={styles.vpIcon}>▶</span>
                <span className={styles.vpHint}>16 : 9 · paste a URL above to preview</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {d.tab === 'upload' && (
        <div className={styles.edRow}>
          <UploadZone
            label="Video file"
            hint="mp4 · webm · max 100 MB"
            folder="projects/videos"
            accept="video/mp4,video/webm,video/*"
            resourceType="video"
            onComplete={(url) => set({ embedUrl: url })}
            value={d.embedUrl || undefined}
          />
        </div>
      )}

      <div className={`${styles.edRow} ${styles.cols2}`}>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Caption <span className={styles.hint}>shown below video</span>
          </label>
          <input
            className={styles.fi}
            type="text"
            value={d.caption}
            placeholder="optional caption…"
            onChange={(e) => set({ caption: e.target.value })}
          />
        </div>
        <Toggle
          label="Autoplay on load"
          subLabel="Muted. Restarts on scroll into view."
          checked={d.autoplay}
          onChange={(v) => set({ autoplay: v })}
        />
      </div>
    </div>
  )
}
