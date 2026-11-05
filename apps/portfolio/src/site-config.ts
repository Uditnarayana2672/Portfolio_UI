// Fixed details that aren't edited in admin. Empty values are hidden on the page.
export const PROFILE = {
  name: 'Udit Narayana',
  email: '', // public contact address
  github: 'https://github.com/Uditnarayana2672',
  linkedin: '',
}

export const BLOG_URL = (import.meta.env.PUBLIC_BLOG_URL ?? 'https://lighthouseinfo.com').replace(/\/$/, '')
