// Small browser behaviours for the static public pages.
export function initSite(): void {
  const burger = document.querySelector<HTMLButtonElement>('.burger')
  const mnav = document.getElementById('mnav')
  burger?.addEventListener('click', () => {
    const open = mnav?.classList.toggle('open') ?? false
    burger.setAttribute('aria-expanded', String(open))
  })
  mnav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    mnav.classList.remove('open')
    burger?.setAttribute('aria-expanded', 'false')
  }))

  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.classList.add('in')
      e.target.querySelectorAll<HTMLElement>('.chip').forEach((c, i) => { c.style.transitionDelay = `${i * 60}ms` })
      e.target.querySelectorAll<HTMLElement>('li').forEach((c, i) => { c.style.transitionDelay = `${i * 130}ms` })
      e.target.querySelectorAll<HTMLElement>('.meter i').forEach((m) => { m.style.width = `${m.dataset.w}%` })
      reveal.unobserve(e.target)
    })
  }, { threshold: 0.12 })
  document.querySelectorAll('.rv,.chips,.pts,.skills').forEach((el) => reveal.observe(el))

  document.querySelectorAll<HTMLElement>('[data-rail]').forEach(initRail)
  initTabs()
  initFilters()
  initPortrait()
  initMediaBits()
  initDialogs()
}

function initRail(root: HTMLElement): void {
  const rail = root.querySelector<HTMLElement>('.rail')
  const prev = root.querySelector<HTMLButtonElement>('.prev')
  const next = root.querySelector<HTMLButtonElement>('.next')
  const dots = root.querySelector<HTMLElement>('.dots')
  const label = root.querySelector<HTMLElement>('.count-lbl')
  if (!rail || !prev || !next || !dots || !label) return
  const items = [...rail.children] as HTMLElement[]
  if (!items.length) return
  const step = () => items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || '24')
  dots.innerHTML = items.map((_, i) => `<button type="button" aria-label="Slide ${i + 1}"></button>`).join('')
  const buttons = [...dots.querySelectorAll('button')]
  buttons.forEach((b, i) => { b.onclick = () => rail.scrollTo({ left: i * step(), behavior: 'smooth' }) })
  const projects = items.filter((i) => i.classList.contains('pcard')).length
  const update = () => {
    const i = Math.round(rail.scrollLeft / step())
    buttons.forEach((b, k) => b.classList.toggle('on', k === i))
    prev.disabled = rail.scrollLeft < 4
    next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4
    label.textContent = i >= projects
      ? 'More projects →'
      : `Project ${String(i + 1).padStart(2, '0')} / ${String(projects).padStart(2, '0')}`
  }
  prev.onclick = () => rail.scrollBy({ left: -step(), behavior: 'smooth' })
  next.onclick = () => rail.scrollBy({ left: step(), behavior: 'smooth' })
  rail.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true })
  window.addEventListener('resize', update)
  rail.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next.click()
    if (e.key === 'ArrowLeft') prev.click()
  })
  update()
}

function initTabs(): void {
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('.tab[data-k]')]
  const panels = [...document.querySelectorAll<HTMLElement>('[data-panel]')]
  const show = (key: string) => {
    tabs.forEach((t) => {
      const on = t.dataset.k === key
      t.classList.toggle('on', on)
      t.setAttribute('aria-selected', String(on))
    })
    panels.forEach((p) => {
      p.hidden = p.dataset.panel !== key
      if (!p.hidden) requestAnimationFrame(() => p.querySelectorAll<HTMLElement>('.meter i').forEach((m) => { m.style.width = `${m.dataset.w}%` }))
    })
  }
  tabs.forEach((t) => { t.onclick = () => show(t.dataset.k ?? '') })
}

function initFilters(): void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('.fbtn[data-c]')]
  const cards = [...document.querySelectorAll<HTMLElement>('.pgrid .pcard')]
  buttons.forEach((b) => {
    b.onclick = () => {
      buttons.forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false') })
      b.classList.add('on')
      b.setAttribute('aria-pressed', 'true')
      cards.forEach((c) => c.classList.toggle('hide', b.dataset.c !== 'All' && c.dataset.cat !== b.dataset.c))
    }
  })
}

function initPortrait(): void {
  const portrait = document.querySelector<HTMLElement>('.portrait')
  if (!portrait || !matchMedia('(hover:hover)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return
  portrait.addEventListener('pointermove', (e) => {
    const r = portrait.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    portrait.style.setProperty('--ry', `${x * 9}deg`)
    portrait.style.setProperty('--rx', `${-y * 9}deg`)
    portrait.style.setProperty('--dx', `${x * -14}px`)
    portrait.style.setProperty('--dy', `${y * -14}px`)
  })
  portrait.addEventListener('pointerleave', () => {
    ;['--rx', '--ry'].forEach((p) => portrait.style.setProperty(p, '0deg'))
    ;['--dx', '--dy'].forEach((p) => portrait.style.setProperty(p, '0px'))
  })
}

function initMediaBits(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const play = target.closest<HTMLElement>('[data-video-play]')
    if (play) {
      const frame = play.closest<HTMLElement>('[data-video-frame]')
      if (!frame) return
      const iframe = document.createElement('iframe')
      iframe.src = frame.dataset.src ?? ''
      iframe.title = frame.dataset.title ?? 'Video'
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
      iframe.allowFullscreen = true
      frame.replaceChildren(iframe)
      return
    }
    const copy = target.closest<HTMLButtonElement>('[data-copy-code]')
    if (copy) {
      navigator.clipboard?.writeText(copy.dataset.code ?? '').then(() => {
        copy.textContent = 'Copied ✓'
        setTimeout(() => { copy.textContent = 'Copy' }, 1400)
      })
      return
    }
    const share = target.closest<HTMLElement>('[data-copy-link]')
    if (share) {
      navigator.clipboard?.writeText(location.href).then(() => {
        share.setAttribute('aria-label', 'Link copied')
        const before = share.textContent
        share.textContent = '✓'
        setTimeout(() => { share.textContent = before }, 1400)
      })
      return
    }
    const summary = target.closest<HTMLElement>('[data-toggle-summary]')
    if (summary) {
      const box = document.getElementById('summary')
      if (box) {
        box.hidden = !box.hidden
        if (!box.hidden) box.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  })
}

function initDialogs(): void {
  const dialog = document.querySelector<HTMLDialogElement>('dialog#subscribe')
  if (!dialog) return
  document.querySelectorAll('[data-open-sub]').forEach((b) => b.addEventListener('click', () => dialog.showModal()))
  dialog.querySelector('.mclose')?.addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close() })
}

/** Reading progress and the active heading in the contents list. */
export function initReading(): void {
  const bar = document.querySelector<HTMLElement>('.prog')
  const headings = [...document.querySelectorAll<HTMLElement>('.bp-article h2[id], .bp-article h3[id]')]
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.side .toc-list a')]
  const onScroll = () => {
    const d = document.documentElement
    if (bar) bar.style.width = `${(d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight)) * 100}%`
    let active = ''
    for (const h of headings) if (h.getBoundingClientRect().top < 180) active = h.id
    links.forEach((l) => l.classList.toggle('on', l.getAttribute('href') === `#${active}`))
  }
  addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}
