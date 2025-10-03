import { describe, expect, it } from 'vitest'
import { calcularRescisao } from './rescisao'
import { DEFAULT_COMPETENCIA_PARAMS } from './competencia'

const salarioBase = 100_000
const entrada = new Date(Date.UTC(2025, 4, 1))
const saida = new Date(Date.UTC(2025, 7, 1))

const params = {
  ...DEFAULT_COMPETENCIA_PARAMS,
  aliquotas: { inssPatronal: 0.2, rat: 0.02, terceiros: 0.058, fgts: 0.08 },
  feriasMetodologia: 'mensal' as const,
}

const closeTo = (value: number, expected: number, delta = 0.02) => {
  expect(Math.abs(value - expected)).toBeLessThanOrEqual(delta)
}

describe('calcularRescisao', () => {
  it('calcula verbas proporcionais respeitando regra dos 15 dias', () => {
    const resultado = calcularRescisao(entrada, saida, salarioBase, params)
    expect(resultado.mesesConsiderados13).toBe(3)
    expect(resultado.mesesConsideradosFerias).toBe(3)
    closeTo(resultado.decimoTerceiroProporcional, 25000)
    closeTo(resultado.feriasProporcionais, 25000)
    closeTo(resultado.tercoFerias, 8333.33)
    closeTo(resultado.fgtsSobreVerbas, 4666.67)
    closeTo(resultado.total, 63000)
  })
})

