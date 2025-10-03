import { describe, expect, it } from 'vitest'
import { calcularPeriodo, DEFAULT_COMPETENCIA_PARAMS, CompetenciaParams } from './competencia'

const salarioBase = 100_000
const entrada = new Date(Date.UTC(2025, 4, 1)) // 1 May 2025
const saida = new Date(Date.UTC(2025, 7, 1)) // 1 Aug 2025 (inclusive)

const baseParams: CompetenciaParams = {
  ...DEFAULT_COMPETENCIA_PARAMS,
  aliquotas: { inssPatronal: 0.2, rat: 0.02, terceiros: 0.058, fgts: 0.08 },
  provisionarMesParcial: true,
  baseDias: 'calendario',
  feriasMetodologia: 'mensal',
}

const closeTo = (value: number, expected: number, delta = 0.02) => {
  expect(Math.abs(value - expected)).toBeLessThanOrEqual(delta)
}

describe('calcularPeriodo', () => {
  it('calcula encargos e provisões para meses cheios e parciais (calendário)', () => {
    const { meses, totais } = calcularPeriodo(entrada, saida, salarioBase, baseParams)
    expect(meses).toHaveLength(4)

    const maio = meses[0]
    closeTo(maio.encargos.inss, 20000)
    closeTo(maio.encargos.fgts, 8000)
    closeTo(maio.encargos.terceiros, 5800)
    closeTo(maio.encargos.rat, 2000)
    closeTo(maio.encargos.total, 35800)
    closeTo(maio.provisoes.decimoTerceiro, 8333.33)
    closeTo(maio.provisoes.ferias, 8333.33)
    closeTo(maio.provisoes.tercoFerias, 2777.78)
    closeTo(maio.provisoes.fgtsProvisoes, 1555.56)
    closeTo(maio.provisoes.total, 21000)
    closeTo(maio.totalMes, 56800)

    const agosto = meses[3]
    closeTo(agosto.diasTrabalhados, 1)
    closeTo(agosto.salarioCompetencia, 3225.81)
    closeTo(agosto.encargos.total, 1154.84)
    closeTo(agosto.provisoes.total, 677.52, 0.1)
    closeTo(agosto.totalMes, 1832.36, 0.1)

    closeTo(totais.periodo, 56800 * 3 + agosto.totalMes)
  })

  it('zera provisões em mês parcial quando política desabilita', () => {
    const params: CompetenciaParams = { ...baseParams, provisionarMesParcial: false }
    const { meses } = calcularPeriodo(entrada, saida, salarioBase, params)
    const agosto = meses[3]
    expect(agosto.provisoes.total).toBe(0)
    closeTo(agosto.totalMes, agosto.encargos.total)
  })

  it('permite base comercial de 30 dias', () => {
    const params: CompetenciaParams = { ...baseParams, baseDias: 'comercial30' }
    const { meses } = calcularPeriodo(entrada, saida, salarioBase, params)
    const agosto = meses[3]
    closeTo(agosto.diasNoMes, 30)
    closeTo(agosto.salarioCompetencia, 3333.33)
  })
})
