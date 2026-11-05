import { request } from './blogApi'
import type {
  ActivityItem,
  AdminComment,
  AdminMessage,
  AdminPortfolioContent,
  AdminSubscriber,
  InboxCounts,
  SiteBuild,
  PortfolioDocument,
  SavedPortfolioContent,
} from '../types/portfolio'

export const getRecentActivity = (limit = 20) =>
  request<{ items: ActivityItem[] }>(`/admin/activity?limit=${limit}`)

export const getPortfolioContent = () =>
  request<AdminPortfolioContent>('/admin/portfolio-content')

export const savePortfolioContent = (version: number, content: PortfolioDocument) =>
  request<SavedPortfolioContent>('/admin/portfolio-content', {
    method: 'PUT',
    body: JSON.stringify({ version, content }),
  })

const patch = (body: unknown): RequestInit => ({ method: 'PATCH', body: JSON.stringify(body) })
const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })
const remove: RequestInit = { method: 'DELETE' }

export const getInboxCounts = () => request<InboxCounts>('/admin/inbox/counts')

export const listComments = (status: string) =>
  request<{ items: AdminComment[]; total: number }>(`/admin/comments?status=${status}&limit=100`)
export const setCommentStatus = (id: string, status: 'approved' | 'pending') =>
  request<AdminComment>(`/admin/comments/${id}`, patch({ status }))
export const deleteComment = (id: string) => request<void>(`/admin/comments/${id}`, remove)
export const replyToComment = (id: string, content: string) =>
  request<AdminComment>(`/admin/comments/${id}/replies`, post({ content }))

export const listMessages = (status: string) =>
  request<{ items: AdminMessage[]; total: number }>(`/admin/contact-messages?status=${status}&limit=100`)
export const setMessageRead = (id: string, read: boolean) =>
  request<AdminMessage>(`/admin/contact-messages/${id}`, patch({ read }))
export const deleteMessage = (id: string) => request<void>(`/admin/contact-messages/${id}`, remove)

export const listSubscribers = (status: string) =>
  request<{ items: AdminSubscriber[]; total: number }>(`/admin/subscribers?status=${status}&limit=100`)
export const deleteSubscriber = (id: string) => request<void>(`/admin/subscribers/${id}`, remove)

export const sendNewsletter = (postId: string, version: number) =>
  request<{ recipients: number; post_slug: string; status: string }>(`/admin/blogs/${postId}/newsletter-sends`, post({ version }))

export const getSiteBuilds = () => request<{ items: SiteBuild[] }>('/admin/site-builds')
export const rebuildSite = (site: SiteBuild['site']) => request<SiteBuild>('/admin/site-builds', post({ site }))
