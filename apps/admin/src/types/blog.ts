// Blog editor types — mirror "New Blog Post API.md" §3.

export type BlogStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export interface TipTapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

export interface TipTapDoc extends TipTapNode {
  type: 'doc'
  schema_version?: number
}

export interface SeoFields {
  meta_title: string | null
  meta_description: string | null
  canonical_url: string | null
}

export interface PostWritable {
  title: string
  subtitle: string | null
  slug: string
  slug_locked: boolean
  content: TipTapDoc
  excerpt: string | null
  cover_asset_id: string | null
  og_asset_id: string | null
  category_id: string | null
  tags: string[]
  allow_comments: boolean
  seo: Partial<SeoFields>
}

export interface MediaRef {
  id: string
  url: string | null
  public_id: string | null
  resource_type: string
  source_type: string
  width: number | null
  height: number | null
  alt_text: string | null
  thumbnail_url: string | null
  external_id?: string | null
  video_title?: string | null
  video_duration_seconds?: number | null
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  post_count: number
  published_count: number
}

export interface ChecklistItem {
  key: string
  label: string
  level: 'blocker' | 'warning'
  passed: boolean
  message: string | null
  paths: string[]
}

export interface Checklist {
  can_publish: boolean
  blocker_count: number
  warning_count: number
  items: ChecklistItem[]
}

export interface PostStats {
  word_count: number
  reading_time_min: number
  block_count: number
  image_count: number
}

export interface PostDetail {
  id: string
  version: number
  title: string
  subtitle: string | null
  slug: string
  slug_locked: boolean
  content: TipTapDoc
  excerpt: string | null
  cover: MediaRef | null
  og_image: MediaRef | null
  category: BlogCategory | null
  tags: string[]
  allow_comments: boolean
  seo: SeoFields
  seo_effective: {
    meta_title: string
    meta_description: string
    canonical_url: string
    og_image_url: string | null
  }
  status: BlogStatus
  status_label: string
  scheduled_at: string | null
  published_at: string | null
  last_published_at: string | null
  has_unpublished_changes: boolean
  public_url: string | null
  schedule_error: string | null
  stats: PostStats
  checklist: Checklist
  author: { id: string; name: string; avatar_url: string | null } | null
  created_at: string
  updated_at: string
}

export interface SaveResult {
  id: string
  version: number
  updated_at: string
  slug: string
  slug_adjusted: boolean
  stats: PostStats
  has_unpublished_changes: boolean
  checklist: Checklist
  warnings: { code: string; message: string; path: string | null }[]
}

export interface SlugCheck {
  input: string
  slug: string
  available: boolean
  reason: string | null
  suggested: string | null
}

export interface RevisionSummary {
  id: string
  kind: 'publish' | 'manual' | 'restore'
  label: string | null
  word_count: number
  created_by: { id: string; name: string | null } | null
  created_at: string
  is_live: boolean
}

export interface RevisionDetail extends RevisionSummary {
  snapshot: Record<string, unknown>
  content_html: string
}

export interface TocEntry {
  id: string
  text: string
  level: number
  number: string | null
}

export interface PublicPost {
  title: string
  subtitle: string | null
  slug: string
  url: string
  cover: { url: string; alt: string; width: number | null; height: number | null; srcset: string } | null
  category: { name: string; slug: string; url: string } | null
  tags: { name: string; url: string }[]
  author: { name: string; avatar_url: string | null }
  published_at: string | null
  updated_at: string
  reading_time_min: number
  word_count: number
  toc: TocEntry[]
  content_html: string
  head: {
    title: string
    meta: Record<string, string>[]
    links: { rel: string; href: string }[]
    json_ld: Record<string, unknown>
  }
}

export interface PreviewPayload {
  source: 'working' | 'live'
  post_id: string
  version: number
  status: BlogStatus
  post: PublicPost
  search_preview: {
    url_display: string
    title: string
    description: string
    title_truncated: boolean
    description_truncated: boolean
  }
  social_preview: {
    image_url: string | null
    title: string
    description: string
    domain: string
    image_source: 'og' | 'cover' | 'default'
  }
  checklist: Checklist
  generated_at: string
}

export interface BlockConfig {
  type: string
  label: string
  icon: string
  group: string
  variants?: { key: string; label: string; attrs?: Record<string, unknown>; icon?: string; shortcut?: string }[]
  slash_keywords: string[]
  toolbar: boolean
  enabled: boolean
}

export interface PaletteToken {
  token: string
  label: string
  bg: string
  fg: string
}

export interface EditorConfig {
  site_url: string
  blog_base_path: string
  timezone: string
  title_suffix: string
  content_schema_version: number
  limits: {
    title: [number, number]
    title_hard_max: number
    subtitle_max: number
    excerpt: [number, number]
    excerpt_hard_max: number
    meta_title: [number, number]
    meta_title_hard_max: number
    meta_description: [number, number]
    meta_description_hard_max: number
    tags_max: number
    tag_length: [number, number]
    min_words: number
    slug_length: [number, number]
    schedule_min_lead_minutes: number
    schedule_max_days_ahead: number
    table_max_rows: number
    table_max_cols: number
    gallery_items: [number, number]
  }
  blocks: BlockConfig[]
  palette: PaletteToken[]
  callout_variants: { id: string; label: string; icon: string }[]
  code_languages: { id: string; label: string }[]
  embed_providers: { id: string; label: string; hosts: string[] }[]
  media_folders: { cover: string; inline: string; gallery: string; video: string; og: string }
  upload: { cover_min_width: number; og_recommended: [number, number] }
  reserved_slugs: string[]
}

export interface ResolvedEmbed {
  provider: string
  original_url: string
  embed_url: string
  height: number
  title: string | null
}

export interface LinkTarget {
  type: 'blog' | 'project'
  id: string
  title: string
  status: string
  url: string
}

// ── Blog Manager ("Blog Manager API.md") ─────────────────────────────────────

export type ListSort = 'updated_at' | 'published_at' | 'created_at' | 'title' | 'views' | 'relevance'

export interface PostListItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  status: BlogStatus
  has_unpublished_changes: boolean
  category: { id: string; name: string; slug: string | null } | null
  tags: string[]
  cover: { id: string; thumb_url: string; alt: string } | null
  read_time: number | null
  word_count: number
  views: number
  author: { id: string; name: string } | null
  version: number
  scheduled_at: string | null
  schedule_error: string | null
  published_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
  /** HTML with only <mark> tags (escaped by the server). */
  search: { rank: number; matched: string[]; snippet: string | null } | null
}

export interface PostListResponse {
  items: PostListItem[]
  total: number
  page: number
  limit: number
  total_pages: number
  facets: { status: Record<string, number>; category: Record<string, number> }
  applied: { status: BlogStatus[]; category_id: string | null; q: string | null; sort: ListSort; dir: 'asc' | 'desc' }
}

export interface PostListParams {
  status: BlogStatus[]
  category: string | null
  q: string
  sort: ListSort | null
  dir: 'asc' | 'desc' | null
  page: number
}

export interface BlogStats {
  total: number
  published: number
  draft: number
  scheduled: number
  archived: number
  created_this_month: number
  next_scheduled_at: string | null
  failed_schedules: number
}

export type BulkAction = 'archive' | 'delete'

export interface BulkResult {
  action: BulkAction
  requested: number
  succeeded: string[]
  failed: { id: string; error: string; message: string; current_version: number | null }[]
}
