export type TechLevel = 'working' | 'advanced' | 'expert'
export type TechCategory = 'ai' | 'backend' | 'frontend' | 'cloud'

export interface Portrait { url: string; alt: string; media_asset_id: string | null }
export interface ImageCrop { x: number; y: number; width: number; height: number }
export interface CompanyImage extends Portrait { crop: ImageCrop | null }
export interface Stat { id: string; source: 'manual' | 'published_projects'; value: string | null; suffix: string; label: string }
export interface Tech {
  id: string; name: string; logo_slug: string | null; category: TechCategory; level: TechLevel
  show_in_strip: boolean; show_in_what_i_do: boolean; show_in_skills: boolean
}
export interface Job {
  id: string; company: string; role: string; start_year: number; end_year: number | null
  summary: string; highlights: string[]; logo: Portrait | null; images: CompanyImage[]
}
export interface Education {
  id: string; degree: string; institution: string; start_year: number; end_year: number | null
  summary: string; highlights: string[]
}
export interface SectionText { title: string; title_soft: string; intro: string }
export interface PortfolioDocument {
  hero: {
    eyebrow: string; headline: string; headline_accent: string; intro: string; highlights: string[]
    portrait: Portrait | null
  }
  about: { statement: string; today: string; stats: Stat[] }
  what_i_do: { title: string; subtitle: string; points: { id: string; text: string }[] }
  skills: SectionText
  tech: Tech[]
  experience_section: SectionText
  experience: Job[]
  education_section: { title: string; title_soft: string }
  education: Education[]
}

export interface ProjectCard {
  id: string; title: string; slug: string; excerpt: string | null; image_url: string | null; tech_stack: string[]
  category: string | null; status_label: string | null; card_stat: { value: string; label: string } | null
  is_featured: boolean; demo_url: string | null; github_url: string | null; published_at: string | null
}
export interface ProjectBlock { id: string; block_type: string; position: number; config: Record<string, unknown> }
export interface ProjectNeighbor { title: string; slug: string; excerpt: string | null; thumbnail_url: string | null }
export interface ProjectDetail {
  id: string; title: string; slug: string; excerpt: string | null; image_url: string | null; tech_stack: string[]
  github_url: string | null; demo_url: string | null; category: string | null; role: string | null
  timeline: string | null; status_label: string | null; recognition: string | null
  seo: { meta_title: string | null; meta_description: string | null; og_image_url: string | null; canonical_url: string | null }
  blocks: ProjectBlock[]; prev_project: ProjectNeighbor | null; next_project: ProjectNeighbor | null
  published_at: string | null; updated_at: string
}

export interface BlogImage { url: string; alt: string; width: number | null; height: number | null; srcset?: string }
export interface BlogCard {
  title: string; subtitle: string | null; slug: string; url: string; excerpt: string | null
  cover: BlogImage | null; category: { name: string; slug: string; url: string } | null
  tags: { name: string; url: string }[]; reading_time_min: number; published_at: string | null
}
export interface BlogPost extends BlogCard {
  author: { name: string; avatar_url: string | null }; updated_at: string; word_count: number
  allow_comments: boolean; toc: { id: string; text: string; level: number }[]; content_html: string
  head: {
    title: string
    meta: ({ name?: string; property?: string; content: string })[]
    links: { rel: string; href: string }[]
    json_ld: Record<string, unknown>
  }
}
export interface PublicComment {
  id: string; author_name: string; is_author: boolean; content: string; created_at: string
  replies?: PublicComment[]
}
export interface PollResult {
  question: string; status: 'open' | 'closed'; total_votes: number; show_results: boolean
  options: { index: number; label: string; votes: number | null; percent: number | null }[]
  my_vote: number | null
}
