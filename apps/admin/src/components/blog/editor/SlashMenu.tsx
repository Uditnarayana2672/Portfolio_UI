import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { Editor, Range } from '@tiptap/react'
import s from './editor.module.css'

export interface SlashItem {
  key: string
  label: string
  icon: string
  hint?: string
  group: string
  keywords: string[]
  run: (editor: Editor, range?: Range) => void
}

export interface SlashMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}

interface Props {
  items: SlashItem[]
  command: (item: SlashItem) => void
}

const GROUP_LABELS: Record<string, string> = {
  text: 'Text', lists: 'Lists', code: 'Code & data', media: 'Media',
}

const SlashMenu = forwardRef<SlashMenuHandle, Props>(function SlashMenu({ items, command }, ref) {
  const [index, setIndex] = useState(0)

  useEffect(() => setIndex(0), [items])

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (!items.length) return false
      if (event.key === 'ArrowDown') {
        setIndex((i) => (i + 1) % items.length)
        return true
      }
      if (event.key === 'ArrowUp') {
        setIndex((i) => (i - 1 + items.length) % items.length)
        return true
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        command(items[index])
        return true
      }
      return false
    },
  }), [items, index, command])

  if (!items.length) {
    return <div className={s.slash}><div className={s.slashEmpty}>No matching block</div></div>
  }

  let lastGroup = ''
  return (
    <div className={s.slash} role="listbox" aria-label="Insert block">
      {items.map((item, i) => {
        const header = item.group !== lastGroup ? GROUP_LABELS[item.group] ?? item.group : null
        lastGroup = item.group
        return (
          <div key={item.key}>
            {header && <div className={s.slashGroup}>{header}</div>}
            <button
              type="button"
              role="option"
              aria-selected={i === index}
              className={`${s.slashItem}${i === index ? ` ${s.slashActive}` : ''}`}
              onMouseEnter={() => setIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                command(item)
              }}
            >
              <span className={s.slashIcon}>{item.icon}</span>
              <span className={s.slashLabel}>{item.label}</span>
              {item.hint && <span className={s.slashHint}>{item.hint}</span>}
            </button>
          </div>
        )
      })}
    </div>
  )
})

export default SlashMenu
