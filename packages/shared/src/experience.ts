// Experience section: orange scroll timeline, rows that lift near the cursor,
// and a company image that follows the cursor through the middle of the section.

const ROTATE_MS = 1600
const NEAR_PX = 220
const REVEAL_PX = 40
const GAP = 28

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

function initCursor(root: HTMLElement, jobs: HTMLElement[], calm: boolean): () => void {
  const section = root.closest<HTMLElement>('.sec') ?? root
  const cards = jobs.map((job) => job.querySelector<HTMLElement>('.xp-card'))
  const pos = { x: 0, y: 0, tx: 0, ty: 0, rx: 0, ry: 0, trx: 0, try: 0 }
  let frame = 0
  let active: HTMLElement | null = null
  let lastX = 0
  let lastY = 0
  let placedOnce = false

  const cardSize = () => {
    const card = cards.find(Boolean)
    return { w: card?.offsetWidth ?? 380, h: card?.offsetHeight ?? 304 }
  }

  /** Keep the image beside the cursor, and clear of the text being read. */
  function target(job: HTMLElement): void {
    const box = root.getBoundingClientRect()
    const { w, h } = cardSize()
    const x = lastX - box.left
    const maxX = Math.max(box.width - w, 0)
    const textRight = (job.querySelector<HTMLElement>('.body')?.getBoundingClientRect().right ?? box.left) - box.left

    let left: number
    if (x < textRight) {
      // Reading the text: stay to its right, drifting slightly with the cursor.
      left = clamp(textRight + GAP + (x / Math.max(textRight, 1)) * 60, 0, maxX)
    } else {
      // Past the text: follow the cursor across the section, flipping side at the edge.
      left = x + GAP + w <= box.width ? x + GAP : x - GAP - w
      left = clamp(left, 0, maxX)
    }

    // Vertically centred on the part of the section that is on screen.
    const area = section.getBoundingClientRect()
    const centre = (Math.max(area.top, 0) + Math.min(area.bottom, innerHeight)) / 2
    pos.tx = left
    pos.ty = clamp(centre - h / 2 - box.top, 0, Math.max(box.height - h, 0))
    pos.trx = clamp(-(lastY - (box.top + pos.ty + h / 2)) / 40, -6, 6)
    pos.try = clamp((lastX - (box.left + left + w / 2)) / 60, -6, 6)
  }

  function paint(): void {
    const ease = calm ? 1 : 0.14
    pos.x += (pos.tx - pos.x) * ease
    pos.y += (pos.ty - pos.y) * ease
    pos.rx += (pos.trx - pos.rx) * ease
    pos.ry += (pos.try - pos.ry) * ease
    root.style.setProperty('--cx', `${pos.x.toFixed(1)}px`)
    root.style.setProperty('--cy', `${pos.y.toFixed(1)}px`)
    root.style.setProperty('--crx', `${pos.rx.toFixed(2)}deg`)
    root.style.setProperty('--cry', `${pos.ry.toFixed(2)}deg`)
    const moving = Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > 0.3
    frame = active || moving ? requestAnimationFrame(paint) : 0
  }
  const wake = () => { if (!frame) frame = requestAnimationFrame(paint) }

  function setActive(job: HTMLElement | null): void {
    if (job === active) return
    active?.classList.remove('active')
    active = job
    if (!job) return
    job.classList.add('active')
    target(job)
    if (!placedOnce) { // appears in place the first time instead of sliding in from the corner
      pos.x = pos.tx
      pos.y = pos.ty
      placedOnce = true
    }
    wake()
  }

  function setLift(y: number, x: number): void {
    const box = root.getBoundingClientRect()
    const inside = x >= box.left - NEAR_PX && x <= box.right + NEAR_PX
    jobs.forEach((job) => {
      const r = job.getBoundingClientRect()
      const distance = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0
      job.style.setProperty('--near', inside ? clamp(1 - distance / NEAR_PX, 0, 1).toFixed(3) : '0')
      job.classList.toggle('near', inside && distance <= REVEAL_PX)
    })
  }

  const onMove = (e: PointerEvent) => {
    lastX = e.clientX
    lastY = e.clientY
    setLift(lastY, lastX)
    const over = jobs.find((job) => {
      const r = job.getBoundingClientRect()
      return lastY >= r.top && lastY <= r.bottom
    }) ?? null
    setActive(over)
    if (active) target(active)
    const card = active?.querySelector<HTMLElement>('.xp-card')
    if (card) {
      const r = card.getBoundingClientRect()
      card.style.setProperty('--sx', `${clamp(((lastX - r.left) / r.width) * 100, 0, 100).toFixed(1)}%`)
      card.style.setProperty('--sy', `${clamp(((lastY - r.top) / r.height) * 100, 0, 100).toFixed(1)}%`)
    }
    wake()
  }
  const onLeave = () => {
    setActive(null)
    jobs.forEach((job) => {
      job.style.setProperty('--near', '0')
      job.classList.remove('near')
    })
  }
  const onScroll = () => { if (active) { target(active); wake() } }
  const onFocus = (e: FocusEvent) => {
    const job = (e.target as HTMLElement).closest<HTMLElement>('.job')
    if (!job) return
    const r = job.getBoundingClientRect()
    lastX = r.left + 10
    lastY = r.top + r.height / 2
    setActive(job)
  }
  const onBlur = () => setActive(null)

  section.addEventListener('pointermove', onMove)
  section.addEventListener('pointerleave', onLeave)
  root.addEventListener('focusin', onFocus)
  root.addEventListener('focusout', onBlur)
  addEventListener('scroll', onScroll, { passive: true })

  return () => {
    cancelAnimationFrame(frame)
    frame = 0
    onLeave()
    section.removeEventListener('pointermove', onMove)
    section.removeEventListener('pointerleave', onLeave)
    root.removeEventListener('focusin', onFocus)
    root.removeEventListener('focusout', onBlur)
    removeEventListener('scroll', onScroll)
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
