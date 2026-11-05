import { createContext } from 'react'

/** Server validation messages keyed by path, e.g. "tech[3].level". */
export const ErrorsContext = createContext<Record<string, string>>({})

export const newId = (prefix: string) => `${prefix}${crypto.randomUUID().slice(0, 8)}`

export function moved<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export const replaced = <T,>(list: T[], index: number, item: T): T[] =>
  list.map((existing, i) => (i === index ? item : existing))

export const removed = <T,>(list: T[], index: number): T[] => list.filter((_, i) => i !== index)
