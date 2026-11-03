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
  return () => root.removeEventListener('click', onClick)
}
