import crypto from 'crypto'

export function roundCentsHalfUp(value) {
  // value is in BRL; return integer cents with half-up (2 decimals)
  // Implement by shifting, rounding with EPS to avoid FP issues
  const cents = Math.round((value + Number.EPSILON) * 100)
  return cents
}

export function formatYYYYMM(d) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function sha256Hex(data) {
  return crypto.createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex')
}

// Compute salary prorata with commercial month = 30 days
export function prorata(salaryMonthly, daysWorked) {
  const daily = salaryMonthly / 30
  const p = Math.min(daysWorked, 30)
  return daily * p
}

// Progressive table calculator
// table: [{ upTo: number, rate: number, deduct?: number }] values in BRL per month
export function calcProgressive(base, table) {
  if (!Array.isArray(table) || table.length === 0) return 0
  let tax = 0
  let remaining = base
  let lastCap = 0
  for (const bracket of table) {
    const cap = Number.isFinite(bracket.upTo) ? bracket.upTo : Infinity
    const width = Math.max(0, Math.min(remaining, cap - lastCap))
    tax += width * (bracket.rate || 0)
    remaining -= width
    lastCap = cap
    if (remaining <= 0) break
  }
  if (table.deduct) tax -= table.deduct
  return Math.max(0, tax)
}

