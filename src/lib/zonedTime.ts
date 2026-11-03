// Wall-clock time in a named timezone (the admin's, e.g. Asia/Kolkata) ⇄ UTC.
// <input type="datetime-local"> has no zone, so scheduling converts here.

function offsetMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at)
  const m = Object.fromEntries(parts.map((p) => [p.type, Number(p.value)]))
  const asUtc = Date.UTC(m.year, m.month - 1, m.day, m.hour, m.minute, m.second)
  return Math.round((asUtc - at.getTime()) / 60000)
}

/** "2026-11-28T09:00" in `timeZone` → ISO string with offset (UTC). */
export function zonedLocalToIso(local: string, timeZone: string): string {
  const [date, time] = local.split('T')
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const offset = offsetMinutes(new Date(guess), timeZone)
  return new Date(guess - offset * 60000).toISOString()
}

/** ISO instant → "YYYY-MM-DDTHH:mm" wall time in `timeZone` (for datetime-local). */
export function isoToZonedLocal(iso: string, timeZone: string): string {
  const at = new Date(iso)
  const shifted = new Date(at.getTime() + offsetMinutes(at, timeZone) * 60000)
  return shifted.toISOString().slice(0, 16)
}

export function formatZoned(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}
