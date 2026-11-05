import { useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Step1Template from '../components/newProject/Step1Template'
import Step2CoreFields from '../components/newProject/Step2CoreFields'
import Step3Blocks from '../components/newProject/Step3Blocks'
import Step5Publish from '../components/newProject/Step5Publish'
import styles from './NewProjectPage.module.css'

const STEP_LABELS = [
  'Template',
  'Core fields',
  'Content blocks',
  'AI assistant',
  'Preview & publish',
]

const TOTAL_STEPS = STEP_LABELS.length

interface StepMeta {
  icon: string
  title: string
  body: string
}

const STEP_META: StepMeta[] = [
  {
    icon: '⬚',
    title: 'Choose a template',
    body: 'Pick one of 5 layout templates. Each seeds a default set of content blocks you can then edit freely.',
  },
  {
    icon: '✎',
    title: 'Core fields',
    body: 'Title, slug, excerpt, status, links, tech stack, featured flag, and SEO metadata.',
  },
  {
    icon: '▦',
    title: 'Content blocks',
    body: 'Compose the page body from 13 block types — hero, text, code, gallery, poll, timeline, and more.',
  },
  {
    icon: '✨',
    title: 'AI assistant',
    body: 'Inline LangGraph writing assistant. Rewrite, expand, or sharpen any text block with one click.',
  },
  {
    icon: '⊙',
    title: 'Preview & publish',
    body: 'Live browser preview, SEO snippet, readiness checklist — then publish or save as a draft.',
  },
]

function StepPlaceholder({ step }: { step: number }) {
  const meta = STEP_META[step - 1]
  return (
    <div className={styles.stepContent}>
      <div className={styles.placeholder}>
        <div className={styles.placeholderIcon}>{meta.icon}</div>
        <div className={styles.placeholderTitle}>{meta.title}</div>
        <div className={styles.placeholderBadge}>
          Step {step} · {STEP_LABELS[step - 1]}
        </div>
        <p className={styles.placeholderBody}>{meta.body}</p>
      </div>
    </div>
  )
}

export default function NewProjectPage() {
  const [currentStep, setCurrentStep] = useState(1)

  function goStep(n: number) {
    if (n >= 1 && n <= TOTAL_STEPS) setCurrentStep(n)
  }

  const stepLabel = STEP_LABELS[currentStep - 1]
  const crumbCur = currentStep === 1
    ? 'New project'
    : `New project — ${stepLabel}`
  const showBack = currentStep > 1
  const showNext = currentStep < TOTAL_STEPS
  const nextLabel = currentStep === 4 ? 'Go to preview →' : 'Continue →'

  return (
    <div className={styles.page}>

      {/* ── Page header ───────────────────────────────────────────── */}
      <header className={styles.pagehead}>
        <div>
          <h1>New Project <span className={styles.scribble}>/ Builder</span></h1>
          <nav className={styles.crumbs}>
            <a href="/dashboard">Dashboard</a>
            {' › '}
            <a href="/admin/projects">Projects</a>
            {' › '}
            <span className={styles.crumbCur}>New project</span>
          </nav>
        </div>
        <div className={styles.meta}>
          Spec § 5.2<br />
          5-step builder
        </div>
      </header>

      <div className={styles.layout}>
        <Sidebar activeItem="Projects" />

        <main className={styles.main}>
          <div className={`${styles.builder} wobble`}>

            {/* ── Builder top bar ────────────────────────────────── */}
            <div className={styles.bTop}>
              <div className={styles.bCrumb}>
                <Link to="/admin/projects" className={styles.bCrumbBack}>
                  ← Projects
                </Link>
                <span className={styles.bCrumbArrow}>/</span>
                <span className={styles.bCrumbCur}>{crumbCur}</span>
              </div>
              <div className={styles.topActs}>
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => goStep(TOTAL_STEPS)}
                >
                  ⌕ Preview
                </button>
                <button className={`${styles.btn} ${styles.btnGhost}`}>
                  Save draft
                </button>
              </div>
            </div>

            {/* ── Step bar ───────────────────────────────────────── */}
            <div className={styles.stepbar}>
              <div className={styles.steps}>
                {STEP_LABELS.map((label, idx) => {
                  const step = idx + 1
                  const isDone = step < currentStep
                  const isActive = step === currentStep
                  return (
                    <div
                      key={step}
                      className={[
                        styles.stepItem,
                        isDone ? styles.done : '',
                        isActive ? styles.active : '',
                      ].join(' ')}
                      role="button"
                      tabIndex={0}
                      aria-current={isActive ? 'step' : undefined}
                      onClick={() => goStep(step)}
                      onKeyDown={(e) => e.key === 'Enter' && goStep(step)}
                    >
                      <div className={styles.stepCircle}>
                        {!isDone && <span className={styles.n}>{step}</span>}
                      </div>
                      <div className={styles.stepLbl}>{label}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Body ───────────────────────────────────────────── */}
            <div className={styles.bBody}>
              {currentStep === 1 && <Step1Template />}
              {currentStep === 2 && <Step2CoreFields />}
              {currentStep === 3 && <Step3Blocks />}
              {currentStep === 4 && <StepPlaceholder key={4} step={4} />}
              {currentStep === 5 && <Step5Publish />}
            </div>

            {/* ── Footer ─────────────────────────────────────────── */}
            <div className={styles.bFoot}>
              <div className={styles.footInfo}>
                step {currentStep} of {TOTAL_STEPS} ·{' '}
                <span className={styles.footStepName}>{stepLabel}</span>
              </div>
              <div className={styles.footBtns}>
                {showBack && (
                  <button
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={() => goStep(currentStep - 1)}
                  >
                    ← Back
                  </button>
                )}
                {showNext && (
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => goStep(currentStep + 1)}
                  >
                    {nextLabel}
                  </button>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
