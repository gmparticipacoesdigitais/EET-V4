// Parameterizable tax tables per year. Defaults yield 0 for simplicity unless customized.

export const TABELA_INSS = {
  DEFAULT: [ /* { upTo: number, rate: number, deduct?: number } */ ],
}

export const TABELA_IRRF = {
  DEFAULT: [ /* { upTo: number, rate: number, deduct?: number } */ ],
}

export function applyProgressiveTable(base, brackets) {
  if (!Array.isArray(brackets) || !brackets.length || !isFinite(base)) return 0
  // Model: cumulative by bracket with parcel to deduct when reaching bracket
  // Supports either (rate, upTo) progressive sum or (rate, deduct) style
  let tax = 0
  let remaining = base
  let prevUp = 0
  for (const b of brackets) {
    const up = isFinite(b.upTo) ? b.upTo : Infinity
    const slice = Math.max(0, Math.min(remaining, up - prevUp))
    tax += slice * (b.rate || 0)
    remaining -= slice
    prevUp = up
    if (remaining <= 0) break
  }
  if (brackets.some(b => 'deduct' in b)) {
    // Apply last bracket deduct if provided (Brazilian IRRF style)
    const last = brackets.find(b => (isFinite(b.upTo) ? base <= b.upTo : true)) || brackets[brackets.length - 1]
    if (last && last.deduct) tax -= last.deduct
  }
  return Math.max(0, tax)
}

