export type ProjectStatus = 'active' | 'maintenance' | 'archived' | 'draft'
export type ProjectTemplate = 'Narrative' | 'Technical' | 'Visual' | 'Minimal' | 'Interactive'

export interface ProjectStats {
  views: number
  reactions: number
}

export interface Project {
  id: string
  title: string
  slug: string
  status: ProjectStatus
  template: ProjectTemplate
  techStack: string[]
  stats: ProjectStats | null
  coverUrl: string | null
  modifiedAt: string
  featured: boolean
}
