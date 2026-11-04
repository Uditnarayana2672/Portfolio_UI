import hljs from 'highlight.js/lib/common'

// Wires the interactive bits of server-rendered post HTML (see
// app/infrastructure/rendering/tiptap_renderer.py): code highlighting + copy,
// YouTube click-to-load, gallery arrows. Returns a cleanup function. The
// future public blog page should call the same function.

export function enhanceArticle(root: HTMLElement): () => void {
  root.querySelectorAll<HTMLElement>('pre code[class*="language-"]').forEach((el) => {
    const lang = el.className.match(/language-(\S+)/)?.[1]
    if (lang && lang !== 'plaintext' && hljs.getLanguage(lang)) hljs.highlightElement(el)
  })

  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement

    const copy = target.closest<HTMLButtonElement>('[data-copy]')
    if (copy) {
      const code = copy.closest('figure')?.querySelector('code')?.textContent ?? ''
      void navigator.clipboard?.writeText(code).then(() => {
        copy.textContent = 'Copied ✓'
        setTimeout(() => { copy.textContent = 'Copy' }, 1600)
      })
      return
    }

    const play = target.closest<HTMLElement>('.bp-video__play')
    if (play) {
      const frame = play.closest<HTMLElement>('[data-youtube]')
      const src = frame?.dataset.youtube
      if (frame && src?.startsWith('https://www.youtube-nocookie.com/embed/')) {
        const iframe = document.createElement('iframe')
        iframe.src = src
        iframe.title = frame.dataset.title ?? 'YouTube video'
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        iframe.allowFullscreen = true
        iframe.referrerPolicy = 'strict-origin-when-cross-origin'
        frame.replaceChildren(iframe)
      }
      return
    }

    const nav = target.closest<HTMLElement>('[data-gallery-prev], [data-gallery-next]')
    if (nav) {
      const track = nav.closest('[data-gallery]')?.querySelector<HTMLElement>('.bp-gallery__track')
      if (track) {
        const dir = nav.hasAttribute('data-gallery-prev') ? -1 : 1
        track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' })
      }
    }
  }

  root.addEventListener('click', onClick)
  const zoomCleanups = [...root.querySelectorAll<HTMLElement>('.bp-image__frame')].map(setupImageZoom)
  return () => {
    root.removeEventListener('click', onClick)
    zoomCleanups.forEach((fn) => fn())
  }
}

// ── image zoom (Blog Manager Plan §8.2) ──────────────────────────────────────
// Zoom 1×–4× inside the image's own frame: + / − / reset buttons, Ctrl/⌘ +
// wheel or trackpad/touch pinch around the pointer, double-click/-tap toggles
// 2×, drag to pan while zoomed, keyboard + − 0 Esc and arrows when focused.
// A plain wheel still scrolls the page.

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const STEP = 0.5
const DOUBLE_TAP_MS = 300

function setupImageZoom(frame: HTMLElement): () => void {
  const img = frame.querySelector('img')
  if (!img || img.closest('a')) return () => {}  // linked images keep their click

  let scale = 1
  let x = 0
  let y = 0
  let hiRes = false
  let lastTap = 0
  const pointers = new Map<number, { x: number; y: number }>()
  let drag: { x: number; y: number; px: number; py: number } | null = null
  let pinch: { dist: number; scale: number } | null = null

  const controls = document.createElement('div')
  controls.className = 'bp-zoom'
  controls.innerHTML =
    '<button type="button" data-zoom="out" aria-label="Zoom out">−</button>' +
    '<span class="bp-zoom__level" aria-live="polite">100%</span>' +
    '<button type="button" data-zoom="in" aria-label="Zoom in">+</button>' +
    '<button type="button" data-zoom="reset" aria-label="Reset zoom">⟲</button>'
  frame.append(controls)
  // The browser's native image drag would swallow the pan gesture.
  img.draggable = false
  frame.tabIndex = 0
  frame.setAttribute('aria-label', `${img.alt || 'Image'} — press + or − to zoom`)
  const level = controls.querySelector<HTMLElement>('.bp-zoom__level')!
  const btnIn = controls.querySelector<HTMLButtonElement>('[data-zoom="in"]')!
  const btnOut = controls.querySelector<HTMLButtonElement>('[data-zoom="out"]')!

  function clamp() {
    const w = frame.clientWidth
    const h = frame.clientHeight
    x = Math.min(0, Math.max(w - w * scale, x))
    y = Math.min(0, Math.max(h - h * scale, y))
  }

  function render(animate: boolean) {
    frame.classList.toggle('is-animating', animate)
    frame.classList.toggle('is-zoomed', scale > 1)
    img!.style.transform = scale === 1 ? '' : `translate(${x}px, ${y}px) scale(${scale})`
    level.textContent = `${Math.round(scale * 100)}%`
    btnIn.disabled = scale >= MAX_ZOOM
    btnOut.disabled = scale <= MIN_ZOOM
  }

  function loadHiRes() {
    const src = img!.dataset.zoomSrc
    if (hiRes || !src) return
    hiRes = true
    const pre = new Image()
    pre.onload = () => {
      img!.removeAttribute('srcset')
      img!.removeAttribute('sizes')
      img!.src = src
    }
    pre.src = src
  }

  /** Zoom to `next`, keeping the point (cx, cy) in frame coordinates still. */
  function zoomAt(next: number, cx: number, cy: number, animate = false) {
    next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
    if (next === scale) return
    if (next > 1) loadHiRes()
    const px = (cx - x) / scale
    const py = (cy - y) / scale
    scale = next
    x = cx - px * scale
    y = cy - py * scale
    if (scale === 1) { x = 0; y = 0 }
    clamp()
    render(animate)
  }

  const centre = () => [frame.clientWidth / 2, frame.clientHeight / 2] as const
  const local = (e: { clientX: number; clientY: number }) => {
    const r = frame.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }
  const reset = () => zoomAt(1, 0, 0, true)

  const onControls = (e: MouseEvent) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-zoom]')?.dataset.zoom
    if (!action) return
    e.stopPropagation()
    if (action === 'reset') reset()
    else zoomAt(scale + (action === 'in' ? STEP : -STEP), ...centre(), true)
  }

  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return  // plain wheel scrolls the page
    e.preventDefault()
    zoomAt(scale * Math.exp(-e.deltaY * 0.01), ...local(e))
  }

  const toggleAt = (cx: number, cy: number) => (scale > 1 ? reset() : zoomAt(2, cx, cy, true))
  const onDblClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.bp-zoom')) return
    toggleAt(...local(e))
  }

  const onPointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('.bp-zoom')) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale }
      drag = null
    } else if (scale > 1) {
      e.preventDefault()
      drag = { x, y, px: e.clientX, py: e.clientY }
      frame.setPointerCapture(e.pointerId)
      frame.classList.add('is-dragging')
    }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      const mid = local({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 })
      zoomAt(pinch.scale * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.dist), ...mid)
    } else if (drag) {
      x = drag.x + (e.clientX - drag.px)
      y = drag.y + (e.clientY - drag.py)
      clamp()
      render(false)
    }
  }

  const onPointerUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId)
    if (pointers.size < 2) pinch = null
    if (pointers.size === 0) {
      drag = null
      frame.classList.remove('is-dragging')
    }
    // Touch has no reliable dblclick: two taps in a row toggle 2×.
    if (e.type === 'pointerup' && e.pointerType === 'touch' && !(e.target as HTMLElement).closest('.bp-zoom')) {
      const now = Date.now()
      if (now - lastTap < DOUBLE_TAP_MS) { toggleAt(...local(e)); lastTap = 0 } else lastTap = now
    }
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.target !== frame) return
    const pan = 40
    switch (e.key) {
      case '+': case '=': zoomAt(scale + STEP, ...centre(), true); break
      case '-': case '_': zoomAt(scale - STEP, ...centre(), true); break
      case '0': case 'Escape': if (scale === 1) return; reset(); break
      case 'ArrowLeft': case 'ArrowRight': case 'ArrowUp': case 'ArrowDown':
        if (scale === 1) return
        x += e.key === 'ArrowLeft' ? pan : e.key === 'ArrowRight' ? -pan : 0
        y += e.key === 'ArrowUp' ? pan : e.key === 'ArrowDown' ? -pan : 0
        clamp()
        render(true)
        break
      default: return
    }
    e.preventDefault()
  }

  const onResize = () => { clamp(); render(false) }

  controls.addEventListener('click', onControls)
  frame.addEventListener('wheel', onWheel, { passive: false })
  frame.addEventListener('dblclick', onDblClick)
  frame.addEventListener('pointerdown', onPointerDown)
  frame.addEventListener('pointermove', onPointerMove)
  frame.addEventListener('pointerup', onPointerUp)
  frame.addEventListener('pointercancel', onPointerUp)
  frame.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
  render(false)

  return () => {
    controls.removeEventListener('click', onControls)
    frame.removeEventListener('wheel', onWheel)
    frame.removeEventListener('dblclick', onDblClick)
    frame.removeEventListener('pointerdown', onPointerDown)
    frame.removeEventListener('pointermove', onPointerMove)
    frame.removeEventListener('pointerup', onPointerUp)
    frame.removeEventListener('pointercancel', onPointerUp)
    frame.removeEventListener('keydown', onKey)
    window.removeEventListener('resize', onResize)
    controls.remove()
    img.removeAttribute('draggable')
    img.style.transform = ''
    frame.classList.remove('is-zoomed', 'is-dragging', 'is-animating')
    frame.removeAttribute('tabindex')
  }
}
