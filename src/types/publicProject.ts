// Shapes returned by the public (unauthenticated) project endpoints.
// Mirrors app/api/v1/schemas/project.py :: PublicProjectResponse.

export interface PublicBlock {
  id: string
  block_type: string
  position: number
  config: Record<string, unknown>
}

export interface PublicNeighbor {
  title: string
  slug: string
  excerpt: string | null
  thumbnail_url: string | null
}

export interface PublicSeo {
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  canonical_url: string | null
}

export type ReactionCounts = Partial<
  Record<'like' | 'love' | 'fire' | 'clap' | 'mind_blown', number>
>

export interface PublicProject {
  id: string
  title: string
  slug: string
  excerpt: string | null
  thumbnail_url: string | null
  tech_stack: string[]
  template_id: string
  github_url: string | null
  demo_url: string | null
  views: number
  seo: PublicSeo
  // Editorial header fields (flat columns). `meta` retained for backward compat.
  category?: string | null
  role?: string | null
  project_timeline?: string | null
  display_status?: string | null
  recognition?: string | null
  meta: Record<string, unknown>
  blocks: PublicBlock[]
  reactions: ReactionCounts
  prev_project: PublicNeighbor | null
  next_project: PublicNeighbor | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export type ReactionType = 'like' | 'love' | 'fire' | 'clap' | 'mind_blown'
