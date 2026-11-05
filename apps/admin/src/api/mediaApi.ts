import axios from 'axios'
import { supabase } from '../lib/supabaseClient'
import type {
  MediaListResponse,
  MediaStats,
  MediaAssetDetail,
  MediaUsage,
  UploadMediaResponse,
  UpdateMediaRequest,
  UpdateMediaResponse,
  BulkDeleteResponse,
  BulkUpdateResponse,
  MediaFilters,
} from '../types/media'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function getAuthHeader(): Promise<Record<string, string>> {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token ?? ''
  return { Authorization: `Bearer ${token}` }
}

// ── 1. List media ─────────────────────────────────────────────────────────

export async function listMedia(filters: Partial<MediaFilters> = {}): Promise<MediaListResponse> {
  const headers = await getAuthHeader()
  const params: Record<string, string | number> = {}
  if (filters.folder)        params.folder        = filters.folder
  if (filters.resource_type) params.resource_type = filters.resource_type
  if (filters.search)        params.search        = filters.search
  if (filters.page)          params.page          = filters.page
  if (filters.limit)         params.limit         = filters.limit
  if (filters.sort_by)       params.sort_by       = filters.sort_by
  if (filters.order)         params.order         = filters.order

  const { data } = await axios.get<MediaListResponse>(`${BASE}/api/v1/admin/media`, {
    headers,
    params,
  })
  return data
}

// ── 2. Get stats ──────────────────────────────────────────────────────────

export async function getMediaStats(): Promise<MediaStats> {
  const headers = await getAuthHeader()
  const { data } = await axios.get<MediaStats>(`${BASE}/api/v1/admin/media/stats`, { headers })
  return data
}

// ── 3. Upload file ────────────────────────────────────────────────────────

export async function uploadMedia(
  file: File,
  folder: string,
  options: { resource_type?: string; file_name?: string; alt_text?: string } = {},
  onProgress?: (pct: number) => void
): Promise<UploadMediaResponse> {
  const headers = await getAuthHeader()
  const form = new FormData()
  form.append('file', file)
  form.append('folder', folder)
  if (options.resource_type) form.append('resource_type', options.resource_type)
  if (options.file_name)     form.append('file_name', options.file_name)
  if (options.alt_text)      form.append('alt_text', options.alt_text)

  const { data } = await axios.post<UploadMediaResponse>(
    `${BASE}/api/v1/admin/media/upload`,
    form,
    {
      headers,
      onUploadProgress: (e) => {
        if (!onProgress) return
        if (e.total && e.total > 0) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        } else {
          // Content-Length unavailable (proxy, chunked, etc.) — show
          // indeterminate progress that never quite reaches 100%.
          const estimated = Math.min(95, Math.round((e.loaded / (e.loaded + 50_000)) * 100))
          onProgress(estimated)
        }
      },
    }
  )
  return data
}

// ── 4. Import from URL ────────────────────────────────────────────────────

export async function importUrl(
  url: string,
  folder: string,
  alt_text?: string
): Promise<UploadMediaResponse> {
  const headers = await getAuthHeader()
  const { data } = await axios.post<UploadMediaResponse>(
    `${BASE}/api/v1/admin/media/import-url`,
    { url, folder, alt_text },
    { headers }
  )
  return data
}

// ── 5a. Get single asset ──────────────────────────────────────────────────

export async function getMediaAsset(assetId: string): Promise<MediaAssetDetail> {
  const headers = await getAuthHeader()
  const { data } = await axios.get<MediaAssetDetail>(
    `${BASE}/api/v1/admin/media/${assetId}`,
    { headers }
  )
  return data
}

// ── 5b. Get asset usage ───────────────────────────────────────────────────

export async function getMediaUsage(assetId: string): Promise<MediaUsage> {
  const headers = await getAuthHeader()
  const { data } = await axios.get<MediaUsage>(
    `${BASE}/api/v1/admin/media/${assetId}/usage`,
    { headers }
  )
  return data
}

// ── 5c. Update asset ──────────────────────────────────────────────────────

export async function updateMedia(
  assetId: string,
  body: UpdateMediaRequest
): Promise<UpdateMediaResponse> {
  const headers = await getAuthHeader()
  const { data } = await axios.patch<UpdateMediaResponse>(
    `${BASE}/api/v1/admin/media/${assetId}`,
    body,
    { headers }
  )
  return data
}

// ── 5d. Delete asset by ID ────────────────────────────────────────────────

export async function deleteMedia(assetId: string, force = false): Promise<void> {
  const headers = await getAuthHeader()
  await axios.delete(`${BASE}/api/v1/admin/media/by-id/${assetId}`, {
    headers,
    params: force ? { force: true } : {},
  })
}

// ── 5e. Bulk delete ───────────────────────────────────────────────────────

export async function bulkDeleteMedia(
  ids: string[],
  force = false
): Promise<BulkDeleteResponse> {
  const headers = await getAuthHeader()
  const { data } = await axios.post<BulkDeleteResponse>(
    `${BASE}/api/v1/admin/media/bulk-delete`,
    { ids, force },
    { headers }
  )
  return data
}

// ── 5f. Bulk update ───────────────────────────────────────────────────────

export async function bulkUpdateMedia(
  ids: string[],
  updates: { folder?: string; alt_text?: string }
): Promise<BulkUpdateResponse> {
  const headers = await getAuthHeader()
  const { data } = await axios.post<BulkUpdateResponse>(
    `${BASE}/api/v1/admin/media/bulk-update`,
    { ids, ...updates },
    { headers }
  )
  return data
}
