// Date utilities (date-only, local timezone) to avoid 31/12 bug

export function parseDMY(dmy) {
  if (!dmy) return null
  const m = String(dmy).trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/)
  if (!m) return null
  const dd = Number(m[1]); const mm = Number(m[2]); const yyyy = Number(m[3])
  const d = new Date(yyyy, mm - 1, dd)
  return isNaN(d) ? null : d
}

export function parseYMD(ymd) {
  if (!ymd) return null
  const m = String(ymd).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const yyyy = Number(m[1]); const mm = Number(m[2]); const dd = Number(m[3])
  const d = new Date(yyyy, mm - 1, dd)
  return isNaN(d) ? null : d
}

export function dateOnly(d) {
  if (!d) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function daysInMonth(y, m /*1-12*/) { return new Date(y, m, 0).getDate() }
export function firstOfMonth(y, m) { return new Date(y, m - 1, 1) }
export function lastOfMonth(y, m) { return new Date(y, m - 1, daysInMonth(y, m)) }

export function clampRange(aStart, aEnd, bStart, bEnd) {
  const start = aStart > bStart ? aStart : bStart
  const end = aEnd < bEnd ? aEnd : bEnd
  return end >= start ? [dateOnly(start), dateOnly(end)] : null
}

export function diffDaysInclusive(a, b) {
  const MS = 24 * 60 * 60 * 1000
  return Math.floor((dateOnly(b) - dateOnly(a)) / MS) + 1
}

export function workedDaysInMonth(adm, fim, y, m) {
  const seg = clampRange(adm, fim, firstOfMonth(y, m), lastOfMonth(y, m))
  if (!seg) return 0
  return diffDaysInclusive(seg[0], seg[1])
}

