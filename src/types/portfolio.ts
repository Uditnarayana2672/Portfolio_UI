export type TechLevel = 'working' | 'advanced' | 'expert'
export type TechCategory = 'ai' | 'backend' | 'frontend' | 'cloud'

export interface Stat { id: string; value: string; suffix: string; label: string }
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
    currently_building: { title: string; subtitle: string; url: string | null }
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
