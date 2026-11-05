import { useState } from 'react'
import MediaPickerModal from '../blog/MediaPickerModal'
import type { MediaRequest } from '../blog/editor/editorBridge'
import type { Portrait } from '../../types/portfolio'
import { FieldError, TextField } from './fields'
import styles from './PortfolioInfo.module.css'

/** Your photo on the main page. The site handles the crop, tint and hover. */
export default function PortraitField({ value, onChange }: {
  value: Portrait | null
  onChange: (value: Portrait | null) => void
}) {
  const [request, setRequest] = useState<MediaRequest | null>(null)

  function choose() {
    setRequest({
      kind: 'image',
      onPick: ([asset]) => {
        if (asset) onChange({ url: asset.url, alt: asset.alt || value?.alt || '', media_asset_id: asset.id })
      },
    } as MediaRequest)
  }

  return (
    <fieldset className={styles.group}>
      <legend>Portrait</legend>
      <div className={styles.portraitRow}>
        {value
          ? <img className={styles.portraitPreview} src={value.url} alt={value.alt} />
          : <div className={styles.portraitEmpty}>No photo</div>}
        <div className={styles.grow}>
          <p className={styles.hint}>A clear photo of your face works best. The site crops it and tints it to fit the theme, and colour fades in on hover.</p>
          <div className={styles.portraitRow}>
            <button type="button" className={styles.add} onClick={choose}>{value ? 'Change photo' : 'Add photo'}</button>
            {value && <button type="button" className={styles.add} onClick={() => onChange(null)}>Remove</button>}
          </div>
          {value && <TextField label="Describe the photo (alt text)" path="hero.portrait.alt" value={value.alt} onChange={(alt) => onChange({ ...value, alt })} />}
          <FieldError path="hero.portrait.url" />
        </div>
      </div>
      {request && (
        <MediaPickerModal request={request} folders={{ inline: 'portfolio' }} coverMinWidth={0} onClose={() => setRequest(null)} />
      )}
    </fieldset>
  )
}
