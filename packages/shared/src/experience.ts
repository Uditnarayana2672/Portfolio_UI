// Experience section: orange scroll timeline, rows that lift near the cursor,
// and a company image fixed on the right that rides up and down with the cursor.

const ROTATE_MS = 1600
const NEAR_PX = 220
const EASE = 0.16

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

export function initExperience(): void {
  const root = document.querySelector<HTMLElement>('[data-xp]')
  if (!root) return
  const jobs = [...root.querySelectorAll<HTMLElement>('.job')]
  if (!jobs.length) return

  initTimeline(root, jobs)
  initRotation(jobs)

  const desktop = matchMedia('(hover:hover) and (min-width:821px)')
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches
  let stop = () => {}
  const apply = () => {
    stop()
    stop = desktop.matches ? initCursor(root, jobs, calm) : initTouch(jobs)
  }
  apply()
  desktop.addEventListener('change', apply)
}

function initTimeline(root: HTMLElement, jobs: HTMLElement[]): void {
  const fill = root.querySelector<HTMLElement>('.xp-fill')
  const update = () => {
    const box = root.getBoundingClientRect()
    const reach = innerHeight * 0.6 - box.top // how far down the list the line has drawn
    const progress = clamp(reach / box.height, 0, 1)
    fill?.style.setProperty('transform', `scaleY(${progress})`)
    jobs.forEach((job) => {
      const dot = job.querySelector<HTMLElement>('.xp-dot')
      if (!dot) return
      const top = dot.getBoundingClientRect().top - box.top
      job.classList.toggle('lit', reach >= top)
    })
  }
  addEventListener('scroll', () => requestAnimationFrame(update), { passive: true })
  addEventListener('resize', update)
  update()
}

/** Jobs with several photos swap between them while their image is showing. */
function initRotation(jobs: HTMLElement[]): void {
  jobs.forEach((job) => {
    const slides = [...job.querySelectorAll<HTMLElement>('.xp-slide')]
    if (slides.length < 2) return
    let index = 0
    setInterval(() => {
      if (!job.classList.contains('active') || document.hidden) return
      slides[index].classList.remove('on')
      index = (index + 1) % slides.length
      slides[index].classList.add('on')
    }, ROTATE_MS)
  })
}

/**
 * Only the cursor's height on the screen matters, and it is re-read on every
 * scroll: a cursor that isn't moving still changes job as the page scrolls past it.
 */
function initCursor(root: HTMLElement, jobs: HTMLElement[], calm: boolean): () => void {
  const section = root.closest<HTMLElement>('.sec') ?? root
  const card = jobs.map((job) => job.querySelector<HTMLElement>('.xp-card')).find(Boolean)
  // Before the first mouse move the browser won't say where the cursor is, so assume mid-screen.
  let cursorY: number | null = innerHeight / 2
  let active: HTMLElement | null = null
  let y = 0
  let targetY = 0
  let placed = false
  let frame = 0
  let lastScroll = scrollY
  let queued = false

  const paint = () => {
    y += (targetY - y) * (calm ? 1 : EASE)
    const settled = Math.abs(targetY - y) <= 0.3
    if (settled) y = targetY
    root.style.setProperty('--cy', `${y.toFixed(1)}px`)
    frame = settled ? 0 : requestAnimationFrame(paint)
  }
  const wake = () => { if (!frame) frame = requestAnimationFrame(paint) }

  function setActive(job: HTMLElement | null): void {
    if (job === active) return
    active?.classList.remove('active', 'near')
    active = job
    job?.classList.add('active', 'near')
  }

  function update(): void {
    const area = section.getBoundingClientRect()
    if (cursorY === null || cursorY < area.top || cursorY > area.bottom) {
      jobs.forEach((job) => job.style.setProperty('--near', '0'))
      setActive(null)
      return
    }

    let closest = jobs[0]
    let closestDistance = Infinity
    jobs.forEach((job) => {
      const r = job.getBoundingClientRect()
      const distance = cursorY! < r.top ? r.top - cursorY! : cursorY! > r.bottom ? cursorY! - r.bottom : 0
      job.style.setProperty('--near', clamp(1 - distance / NEAR_PX, 0, 1).toFixed(3))
      if (distance < closestDistance) { closest = job; closestDistance = distance }
    })
    setActive(closest)

    const box = root.getBoundingClientRect()
    const height = card?.offsetHeight ?? 300
    targetY = clamp(cursorY - height / 2 - box.top, 0, Math.max(box.height - height, 0))
    if (!placed) { y = targetY; placed = true } // first appearance is in place, not sliding in
    wake()
  }

  const onPointer = (e: PointerEvent) => {
    cursorY = e.clientY
    update()
  }
  const onLeaveWindow = () => {
    cursorY = null
    update()
  }
  const onScroll = () => {
    // The card sits in the page, so hold it still on screen while the page moves under it.
    y += scrollY - lastScroll
    lastScroll = scrollY
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      update()
    })
  }
  const onFocus = (e: FocusEvent) => {
    const job = (e.target as HTMLElement).closest<HTMLElement>('.job')
    if (!job || !job.matches(':focus-visible')) return
    const r = job.getBoundingClientRect()
    cursorY = r.top + r.height / 2
    update()
  }

  addEventListener('pointermove', onPointer, { passive: true })
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', update)
  document.documentElement.addEventListener('pointerleave', onLeaveWindow)
  root.addEventListener('focusin', onFocus)
  update()

  return () => {
    cancelAnimationFrame(frame)
    frame = 0
    cursorY = null
    update()
    removeEventListener('pointermove', onPointer)
    removeEventListener('scroll', onScroll)
    removeEventListener('resize', update)
    document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
    root.removeEventListener('focusin', onFocus)
  }
}

/** No cursor: a job opens as it reaches the middle of the screen, and stays open so the page doesn't jump. */
function initTouch(jobs: HTMLElement[]): () => void {
  const watcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('near', 'active')
      watcher.unobserve(entry.target)
    })
  }, { rootMargin: '-35% 0px -35% 0px' })
  jobs.forEach((job) => watcher.observe(job))
  return () => watcher.disconnect()
}
