// ── Core asset ────────────────────────────────────────────────────────────────

export interface MediaAsset {
  id: string
  cloudinary_url: string | null
  public_id: string | null
  resource_type: string        // 'image' | 'video' | 'raw'
  format: string | null
  width: number | null
  height: number | null
  file_size: number | null
  file_name: string | null
  folder: string
  alt_text: string | null
  source_type: string          // 'cloudinary' | 'youtube' | 'url'
  thumbnail_url: string | null
  video_duration_seconds: number | null
  is_orphan: boolean
  cdn_status: string
  uploaded_by: string | null
  uploaded_by_name: string | null
  created_at: string
  updated_at: string
}

export interface MediaAssetDetail extends MediaAsset {
  usage_count: number
}

// ── Usage / references ─────────────────────────────────────────────────────

export interface UsageReference {
  kind: string
  id: string
  title: string | null
  location: string
  url: string
}

export interface MediaUsage {
  asset_id: string
  usage_count: number
  references: UsageReference[]
}

// ── List response ──────────────────────────────────────────────────────────

export interface MediaListResponse {
  assets: MediaAsset[]
  total: number
  page: number
  limit: number
  folder_stats: Record<string, number>
  type_stats: Record<string, number>
}

// ── Stats ──────────────────────────────────────────────────────────────────

export interface StorageStats {
  used_bytes: number
  quota_bytes: number
  used_human: string
  quota_human: string
  percent_used: number
  plan: string
}

export interface CleanupStats {
  ran_at: string
  freed_bytes: number
  freed_human: string
  orphans_removed: number
}

export interface MediaStats {
  total_assets: number
  added_today: number
  counts: Record<string, number>
  storage: StorageStats
  last_cleanup: CleanupStats | null
}

// ── Upload / import responses ──────────────────────────────────────────────

export interface UploadedAsset {
  id: string
  cloudinary_url: string | null
  public_id: string | null
  resource_type: string
  format: string | null
  width: number | null
  height: number | null
  file_size: number | null
  file_name: string | null
  folder: string
  alt_text: string | null
  file_hash: string | null
  uploaded_by: string | null
  created_at: string
}

export interface UploadMediaResponse {
  duplicate: boolean
  asset: UploadedAsset
  renamed?: boolean
  rename_note?: string
}

// ── Update ─────────────────────────────────────────────────────────────────

export interface UpdateMediaRequest {
  alt_text?: string | null
  file_name?: string | null
  folder?: string | null
}

export interface UpdateMediaResponse {
  asset: MediaAsset
  renamed: boolean
  rename_note?: string
}

// ── Bulk delete ────────────────────────────────────────────────────────────

export interface BulkDeleteSkipped {
  id: string
  reason: string
  usage_count: number
  references: { kind: string; title: string | null }[]
}

export interface BulkDeleteResponse {
  deleted: string[]
  skipped: BulkDeleteSkipped[]
  deleted_count: number
  freed_bytes: number
}

// ── Bulk update ────────────────────────────────────────────────────────────

export interface BulkUpdateResponse {
  updated_count: number
  renamed: { id: string; rename_note: string }[]
  assets: MediaAsset[]
}

// ── Upload queue item (client-side only) ───────────────────────────────────

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error' | 'failed'

export interface UploadItem {
  id: string            // client-side uuid
  file: File
  folder: string
  status: UploadStatus
  progress: number      // 0–100
  error: string | null
  result: UploadedAsset | null
}

// ── Folder stats (derived from MediaListResponse.folder_stats) ─────────────

export interface FolderStats {
  name: string
  count: number
}

// ── Filter / query params ──────────────────────────────────────────────────

export interface MediaFilters {
  folder: string | null
  resource_type: string | null   // 'image' | 'video' | 'raw' | null (all)
  search: string
  page: number
  limit: number
  sort_by: 'created_at' | 'file_size' | 'file_name'
  order: 'asc' | 'desc'
}

export type ViewMode = 'grid' | 'list'
