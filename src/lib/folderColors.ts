// Maps a media folder path to a consistent accent color, used for the folder
// dots in the sidebar and the folder pills in the toolbar. Known folders keep
// their original design palette; anything else gets a deterministic fallback
// so newly-created folders still render a stable color.

const FOLDER_COLORS: Record<string, string> = {
  'blog/covers': '#2a5fa3',
  'blog/inline': 'rgba(42,95,163,0.55)',
  'projects/thumbnails': '#c1432a',
  'projects/diagrams': 'rgba(193,67,42,0.55)',
  'system/og-images': '#7a3aa6',
  'system/avatars': '#6aa84f',
  uncategorized: '#9b9789',
}

const FALLBACK_PALETTE = ['#2a5fa3', '#c1432a', '#7a3aa6', '#6aa84f', '#d08b1e', '#9b9789']

export function folderColor(name: string): string {
  if (FOLDER_COLORS[name]) return FOLDER_COLORS[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length]
}

// The short label shown on a folder pill — the last path segment, or the whole
// name when there is no slash (e.g. "uncategorized").
export function folderLabel(name: string): string {
  const idx = name.lastIndexOf('/')
  return idx === -1 ? name : name.slice(idx + 1)
}
