// "The Through-line": one orange line tells the career story as the page scrolls.
// A sound wave (listen) straightens into a route with checkpoints (deliver),
// then branches into a small agent graph (build).

interface Point { x: number; y: number }
interface Layout {
  width: number
  height: number
  fontSize: number
  wave: { from: number; to: number; y: number; amp: number; freq: number }
  route: (end: Point) => string
  checkpoints: Point[]
  root: Point
  nodes: Point[]
  edges: [number, number][] // -1 is the root
  labels: Point[]
}

const TALL: Layout = {
  width: 380,
  height: 540,
  fontSize: 15,
  wave: { from: 24, to: 330, y: 84, amp: 24, freq: 0.075 },
  route: (e) => `C 392 ${e.y} 392 178 330 178 L 70 178 C 6 178 6 372 86 372 L 190 372`,
  checkpoints: [{ x: 270, y: 178 }, { x: 190, y: 178 }, { x: 110, y: 178 }],
  root: { x: 190, y: 372 },
  nodes: [{ x: 84, y: 448 }, { x: 190, y: 470 }, { x: 296, y: 448 }, { x: 132, y: 526 }, { x: 248, y: 526 }],
  edges: [[-1, 0], [-1, 1], [-1, 2], [0, 3], [1, 3], [1, 4], [2, 4]],
  labels: [{ x: 24, y: 30 }, { x: 70, y: 226 }, { x: 110, y: 340 }],
}

const WIDE: Layout = {
  width: 640,
  height: 164,
  fontSize: 22,
  wave: { from: 12, to: 190, y: 96, amp: 24, freq: 0.1 },
  route: () => 'L 400 96',
  checkpoints: [{ x: 250, y: 96 }, { x: 305, y: 96 }, { x: 360, y: 96 }],
  root: { x: 420, y: 96 },
  nodes: [{ x: 500, y: 62 }, { x: 500, y: 134 }, { x: 590, y: 98 }],
  edges: [[-1, 0], [-1, 1], [0, 2], [1, 2]],
  labels: [{ x: 12, y: 26 }, { x: 226, y: 26 }, { x: 420, y: 26 }],
}

const SVG = 'http://www.w3.org/2000/svg'
const LINE_SHARE = 0.72 // how much of the scroll the main line takes; the graph uses the rest

const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max)

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, name)
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)))
  return node
}

function wavePath(l: Layout, phase: number, amp: number): { d: string; end: Point } {
  const { from, to, y, freq } = l.wave
  let d = ''
  let end = { x: from, y }
  for (let x = from; x <= to; x += 4) {
    const t = (x - from) / (to - from)
    const envelope = Math.sin(Math.PI * Math.min(t * 1.02, 1)) ** 0.8 // grows, then settles flat so it joins the route
    const py = y + envelope * amp * Math.sin(x * freq + phase) * (0.65 + 0.35 * Math.sin(x * freq * 0.37 + phase * 0.6))
    d += `${d ? 'L' : 'M'} ${x} ${py.toFixed(2)} `
    end = { x, y: py }
  }
  return { d, end }
}

export function initThroughLine(): void {
  const host = document.querySelector<HTMLElement>('[data-through-line]')
  if (!host) return
  const labels: string[] = JSON.parse(host.dataset.throughLine ?? '[]')
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches
  const wide = matchMedia('(max-width:860px)')
  let stop = () => {}

  function build(): void {
    stop()
    stop = render(host!, labels, wide.matches ? WIDE : TALL, calm)
  }
  build()
  wide.addEventListener('change', build)
}

function render(host: HTMLElement, labels: string[], l: Layout, calm: boolean): () => void {
  const svg = el('svg', { viewBox: `0 0 ${l.width} ${l.height}`, class: 'thru-svg', role: 'presentation' })
  const line = el('path', { class: 'thru-line', fill: 'none', pathLength: 1, 'stroke-dasharray': '1 1' })
  const edgeLines = l.edges.map(() => el('line', { class: 'thru-edge' }))
  const pulses = l.edges.map(() => el('circle', { class: 'thru-pulse', r: 3.2 }))
  const checks = l.checkpoints.map((p) => {
    const g = el('g', { class: 'thru-check', transform: `translate(${p.x} ${p.y})` })
    g.append(el('circle', { r: 10 }), el('path', { d: 'M -4 0 L -1 3.4 L 4.4 -3.4', fill: 'none' }))
    return g
  })
  const nodes = l.nodes.map(() => el('circle', { class: 'thru-node', r: 7 }))
  const root = el('circle', { class: 'thru-node thru-root', r: 11, cx: l.root.x, cy: l.root.y })
  const texts = l.labels.map((p, i) => {
    const t = el('text', { class: 'thru-label', x: p.x, y: p.y, 'font-size': l.fontSize })
    const n = el('tspan', { class: 'thru-n' })
    n.textContent = `0${i + 1} `
    t.append(n, document.createTextNode(labels[i] ?? ''))
    return t
  })
  svg.append(line, ...edgeLines, ...pulses, ...checks, ...nodes, root, ...texts)
  host.replaceChildren(svg)

  const pointer = { x: -999, y: -999, active: false }
  let progress = calm ? 1 : 0 // no scroll drawing when motion is off: show it finished
  let shown = progress
  let phase = 0
  let frame = 0
  let visible = false
  let boost = 0

  const placed = (p: Point): Point => {
    if (!pointer.active) return p
    const dx = pointer.x - p.x
    const dy = pointer.y - p.y
    const pull = clamp(1 - Math.hypot(dx, dy) / 150) * 0.16
    return { x: p.x + dx * pull, y: p.y + dy * pull }
  }

  // Where each checkpoint falls along the line, so it ticks when the line arrives.
  const first = wavePath(l, 0, l.wave.amp)
  line.setAttribute('d', `${first.d}${l.route(first.end)}`)
  const total = line.getTotalLength()
  const stops = l.checkpoints.map((c) => {
    let best = 0
    let bestDistance = Infinity
    for (let i = 0; i <= 300; i++) {
      const at = line.getPointAtLength((total * i) / 300)
      const distance = Math.hypot(at.x - c.x, at.y - c.y)
      if (distance < bestDistance) { bestDistance = distance; best = i / 300 }
    }
    return best
  })
  const routeStart = Math.max((stops[0] ?? 0.5) - 0.08, 0.05)

  function draw(now: number): void {
    shown += (progress - shown) * (calm ? 1 : 0.09)
    phase = calm ? 0 : now / 650
    const near = pointer.active ? clamp(1 - Math.abs(pointer.y - l.wave.y) / 90) : 0
    boost += (near - boost) * 0.08

    const w = wavePath(l, phase, l.wave.amp * (1 + boost * 0.7))
    line.setAttribute('d', `${w.d}${l.route(w.end)}`)
    const lineShown = clamp(shown / LINE_SHARE)
    line.setAttribute('stroke-dashoffset', String(1 - Math.max(lineShown, 0.02)))

    texts[0]?.classList.toggle('on', lineShown > 0.02)
    texts[1]?.classList.toggle('on', lineShown >= routeStart)
    texts[2]?.classList.toggle('on', lineShown >= 0.98)
    checks.forEach((c, i) => c.classList.toggle('on', lineShown >= stops[i]))
    root.classList.toggle('on', lineShown >= 0.99)

    const graph = clamp((shown - LINE_SHARE) / (1 - LINE_SHARE))
    const at = l.nodes.map(placed)
    const rootAt = placed(l.root)
    root.setAttribute('cx', rootAt.x.toFixed(1))
    root.setAttribute('cy', rootAt.y.toFixed(1))
    nodes.forEach((n, i) => {
      n.setAttribute('cx', at[i].x.toFixed(1))
      n.setAttribute('cy', at[i].y.toFixed(1))
      n.classList.toggle('on', graph > (i + 1) / (l.nodes.length + 1))
    })
    l.edges.forEach(([a, b], i) => {
      const from = a === -1 ? rootAt : at[a]
      const to = at[b]
      const grown = clamp(graph * l.edges.length - i * 0.6)
      const edge = edgeLines[i]
      edge.setAttribute('x1', from.x.toFixed(1))
      edge.setAttribute('y1', from.y.toFixed(1))
      edge.setAttribute('x2', (from.x + (to.x - from.x) * grown).toFixed(1))
      edge.setAttribute('y2', (from.y + (to.y - from.y) * grown).toFixed(1))
      const pulse = pulses[i]
      if (calm || graph < 0.98) { pulse.style.opacity = '0'; return }
      const t = (now / 1500 + i * 0.27) % 1
      pulse.style.opacity = String(Math.sin(Math.PI * t))
      pulse.setAttribute('cx', (from.x + (to.x - from.x) * t).toFixed(1))
      pulse.setAttribute('cy', (from.y + (to.y - from.y) * t).toFixed(1))
    })
    if (visible && !calm) frame = requestAnimationFrame(draw)
  }

  function measure(): void {
    if (calm) return
    const r = host.getBoundingClientRect()
    const vh = innerHeight
    // Starts as the graphic enters the screen and finishes before it leaves.
    progress = clamp((vh * 0.92 - r.top) / (r.height + vh * 0.2))
  }

  const onPointer = (e: PointerEvent) => {
    const r = svg.getBoundingClientRect()
    pointer.x = ((e.clientX - r.left) / r.width) * l.width
    pointer.y = ((e.clientY - r.top) / r.height) * l.height
    pointer.active = true
  }
  const onLeave = () => { pointer.active = false }
  host.addEventListener('pointermove', onPointer)
  host.addEventListener('pointerleave', onLeave)
  addEventListener('scroll', measure, { passive: true })
  addEventListener('resize', measure)

  const watcher = new IntersectionObserver(([entry]) => {
    const was = visible
    visible = entry.isIntersecting
    if (visible && !was && !calm) { measure(); frame = requestAnimationFrame(draw) }
  })
  watcher.observe(host)
  measure()
  draw(0)

  return () => {
    cancelAnimationFrame(frame)
    visible = false
    watcher.disconnect()
    removeEventListener('scroll', measure)
    removeEventListener('resize', measure)
    host.removeEventListener('pointermove', onPointer)
    host.removeEventListener('pointerleave', onLeave)
  }
}
