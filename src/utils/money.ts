export type RoundingMode = 'half-even' | 'half-up'

const EPSILON = 1e-10

/** Rounds a number using the specified mode (default: half-even) */
export function round(value: number, casas = 2, modo: RoundingMode = 'half-even'): number {
  if (!isFinite(value)) return 0
  const factor = Math.pow(10, casas)
  const scaled = value * factor

  let result: number

  if (modo === 'half-up') {
    result = Math.round(scaled)
  } else {
    const floor = Math.floor(scaled)
    const diff = scaled - floor

    if (Math.abs(diff - 0.5) < EPSILON) {
      // Tie: choose the even neighbour
      result = floor % 2 === 0 ? floor : floor + 1
    } else if (diff > 0.5) {
      result = floor + 1
    } else if (diff < 0.5) {
      result = floor
    } else {
      // diff == 0.5 but negative values fall here due to floating error
      result = floor % 2 === 0 ? floor : floor + 1
    }
  }

  return result / factor
}

/** Sums a list applying rounding to each element and to the total. */
export function sumRounded(values: number[], casas = 2, modo: RoundingMode = 'half-even'): number {
  const roundedValues = values.map((v) => round(v, casas, modo))
  const total = roundedValues.reduce((acc, v) => acc + v, 0)
  return round(total, casas, modo)
}
