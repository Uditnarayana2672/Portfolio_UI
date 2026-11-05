export type TechLevel = 'working' | 'advanced' | 'expert'
export type TechCategory = 'ai' | 'backend' | 'frontend' | 'cloud'

export interface Stat { id: string; source: 'manual' | 'published_projects'; value: string | null; suffix: string; label: string }
export interface Portrait { url: string; alt: string; media_asset_id: string | null }
export interface Point { id: string; text: string }

export interface Tech {
  id: string
  name: string
  logo_slug: string | null
  categories: TechCategory[]
  level: TechLevel
  show_in_strip: boolean
  show_in_what_i_do: boolean
  show_in_skills: boolean
}

export interface Job {
  id: string
  company: string
  role: string
  start_year: number
  end_year: number | null
  summary: string
  highlights: string[]
}

export interface SectionText { title: string; title_soft: string; intro: string }

export interface PortfolioDocument {
  hero: {
    eyebrow: string
    headline: string
    headline_accent: string
    intro: string
    highlights: string[]
    portrait: Portrait | null
  }
  about: { statement: string; today: string; stats: Stat[] }
  what_i_do: { title: string; subtitle: string; points: Point[] }
  skills: SectionText
  tech: Tech[]
  experience_section: SectionText
  experience: Job[]
}

export interface AdminPortfolioContent {
  version: number
  updated_at: string
  updated_by_name: string | null
  content: PortfolioDocument
}

export interface SavedPortfolioContent extends AdminPortfolioContent {
  changed_sections: string[]
}

export interface ActivityItem {
  id: string
  action_type: string
  category: 'project' | 'blog' | 'media' | 'portfolio' | 'other'
  description: string
  entity_type: string | null
  entity_id: string | null
  entity_title: string | null
  actor: 'you' | 'system'
  link: string | null
  created_at: string
}

export interface InboxCounts { comments_pending: number; messages_unread: number; subscribers_confirmed: number }
export interface SiteBuild { site: 'portfolio' | 'lighthouse'; state: 'up_to_date' | 'waiting' | 'triggered'; dirty_since: string | null; last_triggered_at: string | null }
export interface AdminComment {
  id: string; post: { id: string; title: string; slug: string }; author_name: string; author_email: string | null
  content: string; status: 'pending' | 'approved'; parent_id: string | null; created_at: string
}
export interface AdminMessage { id: string; name: string; email: string; subject: string; message: string; read: boolean; created_at: string }
export interface AdminSubscriber { id: string; email: string; status: string; subscribed_at: string; confirmed_at: string | null }
