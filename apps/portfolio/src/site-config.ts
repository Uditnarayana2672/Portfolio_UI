// Fixed details that aren't edited in admin. Empty values are hidden on the page.
export const PROFILE = {
  name: 'Udit Narayana',
  email: '', // public contact address
  github: 'https://github.com/Uditnarayana2672',
  linkedin: '',
  collegeName: '',
  collegePhoto: '', // e.g. '/college.jpg' in apps/portfolio/public
}

export const BLOG_URL = (import.meta.env.PUBLIC_BLOG_URL ?? 'https://lighthouseinfo.com').replace(/\/$/, '')

export const EDUCATION = [
  {
    years: '2016 — 2020',
    title: 'B.Tech — Computer Science & Engineering',
    detail: 'Specialization in Artificial Intelligence · First Class',
    summary: 'Machine learning, distributed systems and human-computer interaction. Capstone: a neural retrieval engine for lecture archives.',
    points: ['Led the AI student chapter; ran weekly paper-reading circles', 'Built the department’s first course-recommendation model'],
  },
  {
    years: '2023',
    title: 'Deep Learning Specialization',
    detail: 'DeepLearning.AI · Coursera',
    summary: 'Sequence models, attention and transformers — the theory underneath the agents I build today.',
    points: ['Completed all five courses with distinction'],
  },
]
