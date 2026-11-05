import { request } from './blogApi'
import type {
  ActivityItem,
  AdminPortfolioContent,
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
