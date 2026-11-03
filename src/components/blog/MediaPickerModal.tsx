import { useCallback, useEffect, useRef, useState } from 'react'
import { importUrl, listMedia, uploadMedia } from '../../api/mediaApi'
import type { MediaAsset, UploadedAsset } from '../../types/media'
import type { MediaKind, MediaRequest, PickedAsset } from './editor/editorBridge'
import s from './blogUi.module.css'

// One picker for cover, OG image, inline image, gallery and video. Uploads and
// the library go through the existing Media Manager API (folders from
// editor-config), so everything also shows up in Media Manager.

type Tab = 'upload' | 'library' | 'youtube'

const TITLES: Record<MediaKind, string> = {
  cover: 'Cover image',
  og: 'Social share image (1200 × 630)',
  image: 'Insert image',
  gallery: 'Gallery images',
  video: 'Insert video',
}

interface Props {
  request: MediaRequest | null
  folders: Record<string, string>
  coverMinWidth: number
  onClose: () => void
}

function toPicked(a: MediaAsset | UploadedAsset, alt?: string): PickedAsset {
  const full = a as MediaAsset
  return {
    id: a.id,
    url: a.cloudinary_url ?? '',
    public_id: a.public_id,
    resource_type: a.resource_type,
    source_type: full.source_type ?? 'cloudinary',
    width: a.width,
    height: a.height,
    alt: alt ?? a.alt_text ?? '',
    title: full.video_title ?? a.file_name ?? null,
    external_id: full.external_id ?? null,
    thumbnail_url: full.thumbnail_url ?? null,
    duration_seconds: full.video_duration_seconds ?? null,
  }
}

function thumb(a: MediaAsset) {
  if (a.source_type === 'youtube') return a.thumbnail_url ?? ''
  const url = a.cloudinary_url ?? ''
  if (a.resource_type === 'video') return url.replace('/upload/', '/upload/so_1,w_320,h_200,c_fill/').replace(/\.\w+$/, '.jpg')
  return url.includes('/upload/') ? url.replace('/upload/', '/upload/f_auto,q_auto,w_320,h_200,c_fill/') : url
}

// The page mounts this once per request (keyed), so every open starts fresh.
export default function MediaPickerModal({ request, folders, coverMinWidth, onClose }: Props) {
  const kind = request?.kind ?? 'image'
  const isVideo = kind === 'video'
  const multiple = kind === 'gallery'
  const needsAlt = kind !== 'video' && kind !== 'gallery'
  const folder = folders[kind === 'image' ? 'inline' : kind] ?? 'uncategorized'

  const [tab, setTab] = useState<Tab>('upload')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [files, setFiles] = useState<File[]>([])
  const [alt, setAlt] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [search, setSearch] = useState('')
  const [onlyFolder, setOnlyFolder] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<MediaAsset[]>([])
  const dropRef = useRef<HTMLLabelElement>(null)

  const loadLibrary = useCallback(async (p: number) => {
    setBusy(true)
    setError(null)
    try {
      const res = await listMedia({
        folder: onlyFolder ? folder : undefined,
        resource_type: isVideo ? 'video' : 'image',
        search: search || undefined,
        page: p,
        limit: 24,
      })
      setAssets(p === 1 ? res.assets : (prev) => [...prev, ...res.assets])
      setTotalPages(Math.max(1, Math.ceil(res.total / res.limit)))
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the library')
    } finally {
      setBusy(false)
    }
  }, [folder, isVideo, onlyFolder, search])

  useEffect(() => {
    if (!request || tab !== 'library') return
    const t = setTimeout(() => void loadLibrary(1), search ? 300 : 0)
    return () => clearTimeout(t)
  }, [request, tab, loadLibrary, search])

  if (!request) return null

  function finish(picked: PickedAsset[]) {
    request!.onPick(picked)
    onClose()
  }

  async function doUpload() {
    if (!files.length) return
    if (needsAlt && alt.trim().length < 3) {
      setError('Describe the image in a few words (alt text) — screen readers and search engines use it.')
      return
    }
    setBusy(true)
    setError(null)
    const picked: PickedAsset[] = []
    try {
      for (let i = 0; i < files.length; i++) {
        const res = await uploadMedia(
          files[i],
          folder,
          { resource_type: isVideo ? 'video' : 'image', alt_text: needsAlt ? alt.trim() : undefined },
          (pct) => setProgress(Math.round(((i + pct / 100) / files.length) * 100)),
        )
        picked.push(toPicked(res.asset, needsAlt ? alt.trim() : undefined))
      }
      finish(picked)
    } catch (e) {
      const msg = (e as { response?: { data?: { detail?: { message?: string } } } }).response?.data?.detail?.message
      setError(msg ?? (e instanceof Error ? e.message : 'Upload failed'))
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }

  async function doYoutube() {
    if (!youtubeUrl.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await importUrl(youtubeUrl.trim(), folder)
      finish([toPicked(res.asset as unknown as MediaAsset)])
    } catch (e) {
      const data = (e as { response?: { data?: { detail?: { message?: string } } } }).response?.data
      setError(data?.detail?.message ?? 'That link could not be added. Paste a youtube.com or youtu.be link.')
    } finally {
      setBusy(false)
    }
  }

  function toggle(a: MediaAsset) {
    if (!multiple) {
      setSelected([a])
      setAlt(a.alt_text ?? '')
      return
    }
    setSelected((cur) => (cur.some((x) => x.id === a.id) ? cur.filter((x) => x.id !== a.id) : [...cur, a].slice(0, 20)))
  }

  function insertSelected() {
    if (!selected.length) return
    if (needsAlt && alt.trim().length < 3) {
      setError('Add alt text for this image before inserting it.')
      return
    }
    finish(selected.map((a) => toPicked(a, needsAlt ? alt.trim() : undefined)))
  }

  const narrow = kind === 'cover' && selected[0]?.width != null && selected[0].width < coverMinWidth
  const tabs: Tab[] = isVideo ? ['upload', 'library', 'youtube'] : ['upload', 'library']

  return (
    <div className={s.modalBackdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${s.modal} ${s.modalWide}`} role="dialog" aria-modal="true" aria-label={TITLES[kind]}>
        <div className={s.modalHead}>
          <span className={s.modalTitle}>{TITLES[kind]}</span>
          <button type="button" className={s.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={s.tabs}>
          {tabs.map((t) => (
            <button key={t} type="button" className={`${s.tab}${tab === t ? ` ${s.tabOn}` : ''}`} onClick={() => setTab(t)}>
              {t === 'upload' ? 'Upload from device' : t === 'library' ? 'Cloudinary library' : 'YouTube link'}
            </button>
          ))}
        </div>

        <div className={s.modalBody}>
          {tab === 'upload' && (
            <>
              <label
                ref={dropRef}
                className={s.drop}
                onDragOver={(e) => {
                  e.preventDefault()
                  dropRef.current?.classList.add(s.dropOver)
                }}
                onDragLeave={() => dropRef.current?.classList.remove(s.dropOver)}
                onDrop={(e) => {
                  e.preventDefault()
                  dropRef.current?.classList.remove(s.dropOver)
                  const list = Array.from(e.dataTransfer.files)
                  setFiles(multiple ? list.slice(0, 20) : list.slice(0, 1))
                }}
              >
                <input
                  type="file"
                  hidden
                  multiple={multiple}
                  accept={isVideo ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/gif,image/avif'}
                  onChange={(e) => {
                    const list = Array.from(e.target.files ?? [])
                    setFiles(multiple ? list.slice(0, 20) : list.slice(0, 1))
                  }}
                />
                <span className={s.dropGlyph}>⬆</span>
                {files.length
                  ? <span>{files.map((f) => f.name).join(', ')}</span>
                  : <span>Drop {isVideo ? 'a video' : multiple ? 'images' : 'an image'} here, or <u>browse</u></span>}
                <span className={s.dropHint}>
                  {isVideo ? 'mp4 · webm · mov — up to 200 MB' : 'jpg · png · webp · gif — up to 10 MB'}
                  {kind === 'cover' && ` · at least ${coverMinWidth}px wide`}
                  {kind === 'og' && ' · 1200 × 630 recommended'}
                </span>
              </label>
              {needsAlt && (
                <input
                  className={s.input}
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Alt text — what does the image show? (required)"
                  maxLength={250}
                />
              )}
              {busy && <div className={s.progress}><div style={{ width: `${progress}%` }} /></div>}
            </>
          )}

          {tab === 'library' && (
            <>
              <div className={s.libraryBar}>
                <input
                  className={s.input}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by file name or alt text…"
                />
                <label className={s.check}>
                  <input type="checkbox" checked={onlyFolder} onChange={(e) => setOnlyFolder(e.target.checked)} />
                  only <code>{folder}</code>
                </label>
              </div>
              <div className={s.grid}>
                {assets.map((a) => {
                  const on = selected.some((x) => x.id === a.id)
                  return (
                    <button key={a.id} type="button" className={`${s.cell}${on ? ` ${s.cellOn}` : ''}`} onClick={() => toggle(a)}>
                      <img src={thumb(a)} alt={a.alt_text ?? ''} loading="lazy" />
                      <span className={s.cellName}>{a.video_title ?? a.file_name}</span>
                      {on && multiple && <span className={s.cellBadge}>{selected.findIndex((x) => x.id === a.id) + 1}</span>}
                    </button>
                  )
                })}
                {!assets.length && !busy && <div className={s.empty}>Nothing here yet — upload instead.</div>}
              </div>
              {page < totalPages && (
                <button type="button" className={s.btnGhost} disabled={busy} onClick={() => void loadLibrary(page + 1)}>
                  Load more
                </button>
              )}
              {needsAlt && selected.length > 0 && (
                <input
                  className={s.input}
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Alt text for this image (required)"
                  maxLength={250}
                />
              )}
              {narrow && <div className={s.warn}>This image is {selected[0].width}px wide; covers look best at {coverMinWidth}px+.</div>}
            </>
          )}

          {tab === 'youtube' && (
            <>
              <input
                className={s.input}
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
                autoFocus
              />
              <p className={s.note}>
                The video plays right on the page, and readers also get a “Watch on YouTube ↗” link.
                Title and thumbnail are fetched for you.
              </p>
            </>
          )}

          {error && <div className={s.error}>{error}</div>}
        </div>

        <div className={s.modalFoot}>
          <button type="button" className={s.btnGhost} onClick={onClose}>Cancel</button>
          {tab === 'upload' && (
            <button type="button" className={s.btnPrimary} disabled={!files.length || busy} onClick={() => void doUpload()}>
              {busy ? 'Uploading…' : 'Upload & insert'}
            </button>
          )}
          {tab === 'library' && (
            <button type="button" className={s.btnPrimary} disabled={!selected.length} onClick={insertSelected}>
              {multiple ? `Insert ${selected.length || ''} image${selected.length === 1 ? '' : 's'}` : 'Use this'}
            </button>
          )}
          {tab === 'youtube' && (
            <button type="button" className={s.btnPrimary} disabled={!youtubeUrl.trim() || busy} onClick={() => void doYoutube()}>
              {busy ? 'Adding…' : 'Add video'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
