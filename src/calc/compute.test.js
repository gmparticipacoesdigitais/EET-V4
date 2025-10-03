import { describe, it, expect } from 'vitest'
import { parseDMY, parseYMD } from './date'
import { calcularFuncionario } from './compute'

describe('date parsing (no 31/12 bug)', () => {
  it('parseYMD local does not shift to previous day', () => {
    const d = parseYMD('2025-01-01')
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(1)
  })
})

describe('calcularFuncionario basic scenarios', () => {
  it('Caso A: 01/01/2025 a 31/01/2025 => salário cheio', () => {
    const adm = parseDMY('01/01/2025'); const fim = parseDMY('31/01/2025')
    const c = calcularFuncionario({ salario: 3000, adm, fim, params: {} })
    expect(Math.round(c.salario)).toBe(3000)
  })
  it('Caso B: 15/01/2025 a 31/01/2025 => 17 dias de 30', () => {
    const adm = parseDMY('15/01/2025'); const fim = parseDMY('31/01/2025')
    const c = calcularFuncionario({ salario: 2500, adm, fim, params: {} })
    const expected = (2500/30)*17
    expect(Math.round(c.salario)).toBe(Math.round(expected))
    expect(Math.round(c.decimoTerceiro)).toBe(Math.round(2500/12)) // 13º conta jan (>=15)
  })
  it('Caso C: 10/02/2025 a 20/03/2025 => dois meses parciais', () => {
    const adm = parseDMY('10/02/2025'); const fim = parseDMY('20/03/2025')
    const c = calcularFuncionario({ salario: 4000, adm, fim, params: {} })
    expect(c.salario).toBeGreaterThan(0)
  })
  it('13º não conta se < 15 dias no mês', () => {
    const adm = parseDMY('10/02/2025'); const fim = parseDMY('14/02/2025') // 5 dias
    const c = calcularFuncionario({ salario: 4000, adm, fim, params: {} })
    expect(Math.round(c.decimoTerceiro)).toBe(0)
  })
})
