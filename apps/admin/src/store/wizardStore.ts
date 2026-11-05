import { create } from 'zustand'
import type { ProjectStatus } from '../types/project'
import type { BlockId } from '../components/project/blocks/blockTypes'
import { TYPE_BY_ID, defaultEditorData } from '../components/project/blocks/blockTypes'

export type { ProjectStatus }
export type TemplateId = 'narrative' | 'technical' | 'visual' | 'minimal' | 'interactive'

export const TEMPLATE_DEFAULTS: Record<TemplateId, BlockId[]> = {
  narrative:   ['hero', 'text', 'quote', 'text', 'gallery', 'cta'],
  technical:   ['hero', 'text', 'code', 'stats', 'code', 'cta'],
  visual:      ['hero', 'gallery', 'image', 'text', 'gallery', 'cta'],
  minimal:     ['text', 'quote', 'text', 'cta'],
  interactive: ['hero', 'video', 'comparison', 'poll', 'form', 'cta'],
}

export interface SeoFields {
  metaTitle: string
  metaDescription: string
  ogImageUrl: string
}

// Editorial header for the public project detail page.
// One field per backend column (all free-text, all optional). Use " · " or a
// newline inside a value to add a secondary/muted line, e.g. "Live in production
// · v2.1"; the renderer splits on a newline into a main + sub line.
export interface PageMetaFields {
  category: string        // kicker label, e.g. "AI & Agents"
  role: string            // e.g. "Solo — design & build"
  projectTimeline: string // e.g. "Mar – Jun 2025 · ~10 weeks"
  displayStatus: string   // e.g. "Live in production · v2.1"
  recognition: string     // e.g. "Featured project · 12k+ conversations served"
}

export interface CoreFields {
  title: string
  slug: string
  excerpt: string
  status: ProjectStatus
  thumbnailUrl: string
  githubUrl: string
  demoUrl: string
  techStack: string[]
  isFeatured: boolean
  seo: SeoFields
  meta: PageMetaFields
}

export interface WizardBlock {
  id: string
  typeId: BlockId
  preview: string
  data: Record<string, unknown>
}

const CORE_DEFAULTS: CoreFields = {
  title: '',
  slug: '',
  excerpt: '',
  status: 'active',
  thumbnailUrl: '',
  githubUrl: '',
  demoUrl: '',
  techStack: [],
  isFeatured: false,
  seo: { metaTitle: '', metaDescription: '', ogImageUrl: '' },
  meta: {
    category: '', role: '', projectTimeline: '', displayStatus: '', recognition: '',
  },
}

let nextId = 1
function makeBlock(typeId: BlockId, data?: Record<string, unknown>): WizardBlock {
  return {
    id: `b${nextId++}`,
    typeId,
    preview: TYPE_BY_ID[typeId].placeholder,
    data: data ?? defaultEditorData(typeId),
  }
}

function seedBlocks(ids: BlockId[]): WizardBlock[] {
  return ids.map((id) => makeBlock(id))
}

interface WizardState {
  selectedTemplate: TemplateId
  templateBlocks: BlockId[]
  blocks: WizardBlock[]
  coreFields: CoreFields
  setTemplate: (id: TemplateId) => void
  setCoreField: (patch: Partial<CoreFields>) => void
  setSeoField: (patch: Partial<SeoFields>) => void
  setMetaField: (patch: Partial<PageMetaFields>) => void
  addBlock: (typeId: BlockId, data?: Record<string, unknown>, preview?: string) => void
  deleteBlock: (id: string) => void
  reorderBlocks: (blocks: WizardBlock[]) => void
  updateBlock: (id: string, patch: Partial<Pick<WizardBlock, 'data' | 'preview'>>) => void
}

export const useWizardStore = create<WizardState>((set) => ({
  selectedTemplate: 'narrative',
  templateBlocks: TEMPLATE_DEFAULTS['narrative'],
  blocks: seedBlocks(TEMPLATE_DEFAULTS['narrative']),
  coreFields: CORE_DEFAULTS,

  setTemplate: (id) =>
    set({
      selectedTemplate: id,
      templateBlocks: TEMPLATE_DEFAULTS[id],
      blocks: seedBlocks(TEMPLATE_DEFAULTS[id]),
    }),

  setCoreField: (patch) =>
    set((s) => ({ coreFields: { ...s.coreFields, ...patch } })),

  setSeoField: (patch) =>
    set((s) => ({
      coreFields: {
        ...s.coreFields,
        seo: { ...s.coreFields.seo, ...patch },
      },
    })),

  setMetaField: (patch) =>
    set((s) => ({
      coreFields: {
        ...s.coreFields,
        meta: { ...s.coreFields.meta, ...patch },
      },
    })),

  addBlock: (typeId, data, preview) =>
    set((s) => ({
      blocks: [
        ...s.blocks,
        { ...makeBlock(typeId, data), ...(preview !== undefined ? { preview } : {}) },
      ],
    })),

  deleteBlock: (id) =>
    set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),

  reorderBlocks: (blocks) => set({ blocks }),

  updateBlock: (id, patch) =>
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),
}))
