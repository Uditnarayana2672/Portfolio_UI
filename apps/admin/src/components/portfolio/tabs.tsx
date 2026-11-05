import type {
  Education,
  Job,
  PortfolioDocument,
  SectionText,
  Tech,
  TechCategory,
  TechLevel,
} from '../../types/portfolio'
import { FieldError, RowActions, StringList, TechLogo, TextArea, TextField } from './fields'
import { CompanyImagesField, CompanyLogoField } from './CompanyMedia'
import PortraitField from './PortraitField'
import { moved, newId, removed, replaced } from './portfolioHelpers'
import styles from './PortfolioInfo.module.css'

export interface TabProps {
  content: PortfolioDocument
  onChange: (content: PortfolioDocument) => void
}

const HIGHLIGHT_HINT = 'Wrap words in *stars* to highlight them.'

const CATEGORIES: { value: TechCategory; label: string }[] = [
  { value: 'ai', label: 'AI & Agents' },
  { value: 'backend', label: 'Backend' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'cloud', label: 'Cloud & Ops' },
]

const LEVELS: { value: TechLevel; label: string }[] = [
  { value: 'working', label: 'Working' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
]

export function HeroTab({ content, onChange }: TabProps) {
  const hero = content.hero
  const set = (patch: Partial<typeof hero>) => onChange({ ...content, hero: { ...hero, ...patch } })
  return (
    <div className={styles.stack}>
      <TextField label="Small line above the headline" path="hero.eyebrow" value={hero.eyebrow} onChange={(eyebrow) => set({ eyebrow })} />
      <TextArea label="Headline" path="hero.headline" value={hero.headline} rows={2} maxLength={120} hint="Press Enter for a new line." onChange={(headline) => set({ headline })} />
      <TextField label="Orange headline line" path="hero.headline_accent" value={hero.headline_accent} maxLength={120} onChange={(headline_accent) => set({ headline_accent })} />
      <TextArea label="Intro" path="hero.intro" value={hero.intro} onChange={(intro) => set({ intro })} />
      <StringList label="Highlights" path="hero.highlights" values={hero.highlights} max={6} addLabel="Add highlight" onChange={(highlights) => set({ highlights })} />
      <PortraitField value={hero.portrait} onChange={(portrait) => set({ portrait })} />
    </div>
  )
}

export function AboutTab({ content, onChange }: TabProps) {
  const about = content.about
  const set = (patch: Partial<typeof about>) => onChange({ ...content, about: { ...about, ...patch } })
  const stats = about.stats

  return (
    <div className={styles.stack}>
      <TextArea label="Statement" path="about.statement" value={about.statement} hint={HIGHLIGHT_HINT} onChange={(statement) => set({ statement })} />
      <TextArea label="“Today I build” text" path="about.today" value={about.today} hint={HIGHLIGHT_HINT} onChange={(today) => set({ today })} />
      <fieldset className={styles.group}>
        <legend>Stats</legend>
        {stats.map((stat, i) => (
          <div key={stat.id} className={styles.card}>
            <div className={styles.statRow}>
              {stat.source === 'manual'
                ? <TextField label="Value" path={`about.stats[${i}].value`} value={stat.value ?? ''} maxLength={12} onChange={(value) => set({ stats: replaced(stats, i, { ...stat, value }) })} />
                : <div className={styles.field}><span className={styles.label}>Value</span><span className={styles.autoValue}>Auto</span></div>}
              <TextField label="Suffix" path={`about.stats[${i}].suffix`} value={stat.suffix} maxLength={4} onChange={(suffix) => set({ stats: replaced(stats, i, { ...stat, suffix }) })} />
              <TextField label="Label" path={`about.stats[${i}].label`} value={stat.label} onChange={(label) => set({ stats: replaced(stats, i, { ...stat, label }) })} />
              <RowActions index={i} count={stats.length} name={`stat ${i + 1}`} onMove={(from, to) => set({ stats: moved(stats, from, to) })} onRemove={(index) => set({ stats: removed(stats, index) })} />
            </div>
            <label className={styles.checks}>
              <input
                type="checkbox"
                checked={stat.source === 'published_projects'}
                onChange={(e) => set({
                  stats: replaced(stats, i, e.target.checked
                    ? { ...stat, source: 'published_projects', value: null }
                    : { ...stat, source: 'manual', value: stat.value ?? '' }),
                })}
              /> Count my published projects automatically
            </label>
          </div>
        ))}
        <FieldError path="about.stats" />
        <button type="button" className={styles.add} disabled={stats.length >= 6} onClick={() => set({ stats: [...stats, { id: newId('st'), source: 'manual', value: '', suffix: '', label: '' }] })}>
          + Add stat
        </button>
      </fieldset>
    </div>
  )
}

export function WhatIDoTab({ content, onChange }: TabProps) {
  const section = content.what_i_do
  const set = (patch: Partial<typeof section>) => onChange({ ...content, what_i_do: { ...section, ...patch } })
  const points = section.points

  return (
    <div className={styles.stack}>
      <TextField label="Title" path="what_i_do.title" value={section.title} maxLength={120} hint={HIGHLIGHT_HINT} onChange={(title) => set({ title })} />
      <TextField label="Subtitle" path="what_i_do.subtitle" value={section.subtitle} onChange={(subtitle) => set({ subtitle })} />
      <fieldset className={styles.group}>
        <legend>Points</legend>
        {points.map((point, i) => (
          <div key={point.id} className={styles.stringRow}>
            <div className={styles.grow}>
              <TextArea label={`Point ${String(i + 1).padStart(2, '0')}`} path={`what_i_do.points[${i}].text`} value={point.text} rows={2} hint={i === 0 ? HIGHLIGHT_HINT : undefined} onChange={(text) => set({ points: replaced(points, i, { ...point, text }) })} />
            </div>
            <RowActions index={i} count={points.length} name={`point ${i + 1}`} onMove={(from, to) => set({ points: moved(points, from, to) })} onRemove={(index) => set({ points: removed(points, index) })} />
          </div>
        ))}
        <FieldError path="what_i_do.points" />
        <button type="button" className={styles.add} disabled={points.length >= 8} onClick={() => set({ points: [...points, { id: newId('p'), text: '' }] })}>
          + Add point
        </button>
      </fieldset>
      <p className={styles.hint}>The tech chips in this section come from the Tech &amp; skills tab.</p>
    </div>
  )
}

function SectionTextFields({ path, value, onChange }: {
  path: string
  value: SectionText
  onChange: (value: SectionText) => void
}) {
  return (
    <>
      <TextField label="Title" path={`${path}.title`} value={value.title} maxLength={120} onChange={(title) => onChange({ ...value, title })} />
      <TextField label="Grey second line" path={`${path}.title_soft`} value={value.title_soft} maxLength={120} onChange={(title_soft) => onChange({ ...value, title_soft })} />
      <TextArea label="Intro" path={`${path}.intro`} value={value.intro} rows={2} onChange={(intro) => onChange({ ...value, intro })} />
    </>
  )
}

function TechRow({ tech, index, count, onChange, onMove, onRemove }: {
  tech: Tech
  index: number
  count: number
  onChange: (tech: Tech) => void
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
}) {
  const path = `tech[${index}]`
  return (
    <div className={styles.card}>
      <div className={styles.techHead}>
        <TechLogo name={tech.name} slug={tech.logo_slug} />
        <div className={styles.techMain}>
          <TextField label="Name" path={`${path}.name`} value={tech.name} maxLength={60} onChange={(name) => onChange({ ...tech, name })} />
          <TextField
            label="Logo slug (optional)"
            path={`${path}.logo_slug`}
            value={tech.logo_slug ?? ''}
            maxLength={60}
            placeholder="e.g. python"
            onChange={(slug) => onChange({ ...tech, logo_slug: slug.trim() ? slug.trim().toLowerCase() : null })}
          />
          <label className={styles.field}>
            <span className={styles.label}>Level</span>
            <select value={tech.level} onChange={(e) => onChange({ ...tech, level: e.target.value as TechLevel })}>
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <FieldError path={`${path}.level`} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Category</span>
            <select value={tech.category} onChange={(e) => onChange({ ...tech, category: e.target.value as TechCategory })}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <FieldError path={`${path}.category`} />
          </label>
        </div>
        <RowActions index={index} count={count} name={tech.name || 'tech'} onMove={onMove} onRemove={onRemove} />
      </div>
      <div className={styles.checks}>
        <span className={styles.label}>Show in</span>
        <label><input type="checkbox" checked={tech.show_in_strip} onChange={(e) => onChange({ ...tech, show_in_strip: e.target.checked })} /> Scrolling strip</label>
        <label><input type="checkbox" checked={tech.show_in_what_i_do} onChange={(e) => onChange({ ...tech, show_in_what_i_do: e.target.checked })} /> What I do</label>
        <label><input type="checkbox" checked={tech.show_in_skills} onChange={(e) => onChange({ ...tech, show_in_skills: e.target.checked })} /> Skill bars</label>
      </div>
    </div>
  )
}

export function TechTab({ content, onChange }: TabProps) {
  const tech = content.tech
  const setTech = (next: Tech[]) => onChange({ ...content, tech: next })

  return (
    <div className={styles.stack}>
      <fieldset className={styles.group}>
        <legend>Section text</legend>
        <SectionTextFields path="skills" value={content.skills} onChange={(skills) => onChange({ ...content, skills })} />
      </fieldset>
      <fieldset className={styles.group}>
        <legend>Tech ({tech.length})</legend>
        <p className={styles.hint}>Logo slugs come from simpleicons.org. If there is no logo, a small letter badge is shown.</p>
        {tech.map((item, i) => (
          <TechRow
            key={item.id}
            tech={item}
            index={i}
            count={tech.length}
            onChange={(next) => setTech(replaced(tech, i, next))}
            onMove={(from, to) => setTech(moved(tech, from, to))}
            onRemove={(index) => setTech(removed(tech, index))}
          />
        ))}
        <FieldError path="tech" />
        <button
          type="button"
          className={styles.add}
          disabled={tech.length >= 60}
          onClick={() => setTech([...tech, {
            id: newId('t'),
            name: '',
            logo_slug: null,
            category: 'ai',
            level: 'working',
            show_in_strip: true,
            show_in_what_i_do: true,
            show_in_skills: true,
          }])}
        >
          + Add tech
        </button>
      </fieldset>
    </div>
  )
}

function JobRow({ job, index, count, onChange, onMove, onRemove }: {
  job: Job
  index: number
  count: number
  onChange: (job: Job) => void
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
}) {
  const path = `experience[${index}]`
  const current = job.end_year === null

  return (
    <div className={styles.card}>
      <div className={styles.jobHead}>
        <strong className={styles.jobTitle}>{job.company || 'New job'}</strong>
        <RowActions index={index} count={count} name={job.company || 'job'} onMove={onMove} onRemove={onRemove} />
      </div>
      <div className={styles.twoCol}>
        <TextField label="Company" path={`${path}.company`} value={job.company} maxLength={80} onChange={(company) => onChange({ ...job, company })} />
        <TextField label="Role" path={`${path}.role`} value={job.role} maxLength={120} onChange={(role) => onChange({ ...job, role })} />
      </div>
      <div className={styles.yearRow}>
        <label className={styles.field}>
          <span className={styles.label}>Start year</span>
          <input type="number" min={1950} max={2100} value={job.start_year} onChange={(e) => onChange({ ...job, start_year: Number(e.target.value) })} />
          <FieldError path={`${path}.start_year`} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>End year</span>
          <input
            type="number"
            min={1950}
            max={2100}
            disabled={current}
            value={job.end_year ?? ''}
            onChange={(e) => onChange({ ...job, end_year: Number(e.target.value) })}
          />
          <FieldError path={`${path}.end_year`} />
        </label>
        <label className={styles.present}>
          <input type="checkbox" checked={current} onChange={(e) => onChange({ ...job, end_year: e.target.checked ? null : new Date().getFullYear() })} /> I work here now
        </label>
      </div>
      <FieldError path={path} />
      <TextArea label="Summary" path={`${path}.summary`} value={job.summary} rows={2} onChange={(summary) => onChange({ ...job, summary })} />
      <StringList label="Highlights" path={`${path}.highlights`} values={job.highlights} max={8} addLabel="Add highlight" onChange={(highlights) => onChange({ ...job, highlights })} />
      <CompanyLogoField company={job.company} path={`${path}.logo`} value={job.logo} onChange={(logo) => onChange({ ...job, logo })} />
      <CompanyImagesField company={job.company} path={`${path}.images`} value={job.images} onChange={(images) => onChange({ ...job, images })} />
    </div>
  )
}

export function ExperienceTab({ content, onChange }: TabProps) {
  const jobs = content.experience
  const setJobs = (experience: Job[]) => onChange({ ...content, experience })

  return (
    <div className={styles.stack}>
      <fieldset className={styles.group}>
        <legend>Section text</legend>
        <SectionTextFields path="experience_section" value={content.experience_section} onChange={(experience_section) => onChange({ ...content, experience_section })} />
      </fieldset>
      <fieldset className={styles.group}>
        <legend>Jobs ({jobs.length})</legend>
        {jobs.map((job, i) => (
          <JobRow
            key={job.id}
            job={job}
            index={i}
            count={jobs.length}
            onChange={(next) => setJobs(replaced(jobs, i, next))}
            onMove={(from, to) => setJobs(moved(jobs, from, to))}
            onRemove={(index) => setJobs(removed(jobs, index))}
          />
        ))}
        <FieldError path="experience" />
        <button
          type="button"
          className={styles.add}
          disabled={jobs.length >= 20}
          onClick={() => setJobs([{
            id: newId('e'),
            company: '',
            role: '',
            start_year: new Date().getFullYear(),
            end_year: null,
            summary: '',
            highlights: [],
            logo: null,
            images: [],
          }, ...jobs])}
        >
          + Add job
        </button>
      </fieldset>
    </div>
  )
}

function EducationRow({ item, index, count, onChange, onMove, onRemove }: {
  item: Education
  index: number
  count: number
  onChange: (item: Education) => void
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
}) {
  const path = `education[${index}]`
  const ongoing = item.end_year === null

  return (
    <div className={styles.card}>
      <div className={styles.jobHead}>
        <strong className={styles.jobTitle}>{item.degree || 'New entry'}</strong>
        <RowActions index={index} count={count} name={item.degree || 'education entry'} onMove={onMove} onRemove={onRemove} />
      </div>
      <div className={styles.twoCol}>
        <TextField label="Degree or course" path={`${path}.degree`} value={item.degree} maxLength={120} onChange={(degree) => onChange({ ...item, degree })} />
        <TextField label="Institution" path={`${path}.institution`} value={item.institution} maxLength={120} onChange={(institution) => onChange({ ...item, institution })} />
      </div>
      <div className={styles.yearRow}>
        <label className={styles.field}>
          <span className={styles.label}>Start year</span>
          <input type="number" min={1950} max={2100} value={item.start_year} onChange={(e) => onChange({ ...item, start_year: Number(e.target.value) })} />
          <FieldError path={`${path}.start_year`} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>End year</span>
          <input type="number" min={1950} max={2100} disabled={ongoing} value={item.end_year ?? ''} onChange={(e) => onChange({ ...item, end_year: Number(e.target.value) })} />
          <FieldError path={`${path}.end_year`} />
        </label>
        <label className={styles.present}>
          <input type="checkbox" checked={ongoing} onChange={(e) => onChange({ ...item, end_year: e.target.checked ? null : new Date().getFullYear() })} /> Still studying
        </label>
      </div>
      <FieldError path={path} />
      <TextArea label="Summary (optional)" path={`${path}.summary`} value={item.summary} rows={2} onChange={(summary) => onChange({ ...item, summary })} />
      <StringList label="Highlights" path={`${path}.highlights`} values={item.highlights} max={8} addLabel="Add highlight" onChange={(highlights) => onChange({ ...item, highlights })} />
    </div>
  )
}

export function EducationTab({ content, onChange }: TabProps) {
  const items = content.education
  const section = content.education_section
  const setItems = (education: Education[]) => onChange({ ...content, education })

  return (
    <div className={styles.stack}>
      <fieldset className={styles.group}>
        <legend>Section text</legend>
        <TextField label="Title" path="education_section.title" value={section.title} maxLength={120} onChange={(title) => onChange({ ...content, education_section: { ...section, title } })} />
        <TextField label="Grey second line" path="education_section.title_soft" value={section.title_soft} maxLength={120} onChange={(title_soft) => onChange({ ...content, education_section: { ...section, title_soft } })} />
      </fieldset>
      <fieldset className={styles.group}>
        <legend>Education ({items.length})</legend>
        {items.map((item, i) => (
          <EducationRow
            key={item.id}
            item={item}
            index={i}
            count={items.length}
            onChange={(next) => setItems(replaced(items, i, next))}
            onMove={(from, to) => setItems(moved(items, from, to))}
            onRemove={(index) => setItems(removed(items, index))}
          />
        ))}
        <FieldError path="education" />
        <button
          type="button"
          className={styles.add}
          disabled={items.length >= 10}
          onClick={() => setItems([{
            id: newId('ed'),
            degree: '',
            institution: '',
            start_year: new Date().getFullYear(),
            end_year: null,
            summary: '',
            highlights: [],
          }, ...items])}
        >
          + Add education
        </button>
      </fieldset>
    </div>
  )
}
