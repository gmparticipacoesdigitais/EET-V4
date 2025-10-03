import { describe, it, expect } from 'vitest'
import { calcularCustoMensal } from './custoMensal'

function closeTo(value, expected, delta = 0.02) {
  expect(Math.abs(value - expected)).toBeLessThanOrEqual(delta)
}

describe('calcularCustoMensal - Caso Maria (2025)', () => {
  const months = [
    { y: 2025, m: 1, diasNoMes: 31 },
    { y: 2025, m: 2, diasNoMes: 28 },
    { y: 2025, m: 3, diasNoMes: 31 },
    { y: 2025, m: 4, diasNoMes: 30 },
    { y: 2025, m: 5, diasNoMes: 31 },
  ]

  it('sem multa FGTS: enc13/encFerias existem (>=15), totalMes e arredondamento corretos', () => {
    const results = months.map(({ diasNoMes }, idx) => {
      const salarioBase = 100_000
      const diasTrabalhados = idx < 4 ? diasNoMes : 16
      const salarioMes = idx < 4 ? salarioBase : (salarioBase * (16 / 31))
      return calcularCustoMensal({
        salarioMes,
        diasTrabalhados,
        diasNoMes,
        ratBase: 0.02,
        fap: 1.0,
        aliquotaTerceiros: 0.058,
        considerarMultaFGTS: false,
      })
    })

    // Todos têm >=15 dias → provisões presentes e encargos sobre provisões > 0
    results.forEach((r) => {
      expect(r.provisoes.decimoMes).toBeGreaterThan(0)
      expect(r.provisoes.feriasMes).toBeGreaterThan(0)
      expect(r.provisoes.umTercoMes).toBeGreaterThan(0)
      expect(r.encargos.enc13).toBeGreaterThan(0)
      expect(r.encargos.encFerias).toBeGreaterThan(0)

      // Verifica totalMes = salarioMes + subtotalEncargos + subtotalProvisoes
      const totalEsperado = r.bases.baseINSS + r.encargos.subtotalEncargos + r.provisoes.subtotalProvisoes
      closeTo(r.totais.totalMes, totalEsperado)

      // Verifica política de arredondamento: subtotais somam bases não arredondadas
      const fgtsRaw = 0.08 * r.bases.baseFGTS
      const multaRaw = 0 // sem multa neste teste
      const subtotalEncRaw = r.encargos.inss + r.encargos.rat + r.encargos.terceiros + fgtsRaw + r.encargos.enc13 + r.encargos.encFerias + multaRaw
      closeTo(r.encargos.subtotalEncargos, Math.round(subtotalEncRaw * 100) / 100)
      const subtotalProvRaw = r.provisoes.decimoMes + r.provisoes.feriasMes + r.provisoes.umTercoMes + r.provisoes.fgtsProvisoes
      closeTo(r.provisoes.subtotalProvisoes, Math.round(subtotalProvRaw * 100) / 100)
    })
  })

  it('com multa FGTS: multa entra no subtotalEncargos e no totalMes', () => {
    const { diasNoMes } = months[4]
    const salarioBase = 100_000
    const diasTrabalhados = 16
    const salarioMes = salarioBase * (16 / 31)
    const r = calcularCustoMensal({
      salarioMes,
      diasTrabalhados,
      diasNoMes,
      ratBase: 0.02,
      fap: 1.0,
      aliquotaTerceiros: 0.058,
      considerarMultaFGTS: true,
    })
    expect(r.encargos.multaFGTS).toBeGreaterThan(0)
    const fgtsRaw = 0.08 * r.bases.baseFGTS
    const multaRaw = 0.032 * r.bases.baseFGTS
    const subtotalEncRaw = r.encargos.inss + r.encargos.rat + r.encargos.terceiros + fgtsRaw + r.encargos.enc13 + r.encargos.encFerias + multaRaw
    closeTo(r.encargos.subtotalEncargos, Math.round(subtotalEncRaw * 100) / 100)
    const totalEsperado = r.bases.baseINSS + r.encargos.subtotalEncargos + r.provisoes.subtotalProvisoes
    closeTo(r.totais.totalMes, totalEsperado)
  })

  it('usa defaults e emite avisos quando parâmetros faltam', () => {
    const { diasNoMes } = months[0]
    const r = calcularCustoMensal({
      salarioMes: 100_000,
      diasTrabalhados: diasNoMes,
      diasNoMes,
      // sem ratBase, fap, aliquotaTerceiros
    })
    expect(r.avisos.usouRatBaseDefault).toBe(true)
    expect(r.avisos.usouFapDefault).toBe(true)
    expect(r.avisos.usouTerceirosDefault).toBe(true)
    expect(r.avisos.mensagens.length).toBeGreaterThanOrEqual(1)
    // Checa que não explode e totalMes faz sentido
    const totalEsperado = r.bases.baseINSS + r.encargos.subtotalEncargos + r.provisoes.subtotalProvisoes
    closeTo(r.totais.totalMes, totalEsperado)
  })
})

