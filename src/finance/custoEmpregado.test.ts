import { describe, it, expect } from 'vitest'
import { calcularCustoEmpregadoMensal } from './custoEmpregado'

function closeTo(value: number, expected: number, delta = 0.02) {
  expect(Math.abs(value - expected)).toBeLessThanOrEqual(delta)
}

describe('Custo Empregado CLT - Caso Maria (2025)', () => {
  const cnae = '47.11-3/02' // comércio varejista (médio risco esperado 2%)
  const fap = 1.0
  const fpas = '515' // Terceiros ~5,8%

  it('Gera provisões e encargos consistentes com regra dos 15, arredondamento e totais', () => {
    const meses = [
      { y: 2025, m: 1, diasNoMes: 31 },
      { y: 2025, m: 2, diasNoMes: 28 },
      { y: 2025, m: 3, diasNoMes: 31 },
      { y: 2025, m: 4, diasNoMes: 30 },
      { y: 2025, m: 5, diasNoMes: 31 },
    ]

    const results = meses.map(({ diasNoMes }, idx) => {
      const salarioBase = 100_000
      const diasTrabalhados = idx < 4 ? diasNoMes : 16
      const salarioMes = idx < 4 ? salarioBase : (salarioBase * (16 / diasNoMes))
      return calcularCustoEmpregadoMensal({ salarioMes, diasTrabalhados, diasNoMes, cnae, fap, fpas })
    })

    // Todos os meses informam CNAE/FAP/FPAS → sem avisos default
    results.forEach((r) => {
      expect(r.avisos.usouRatBaseDefault).toBe(false)
      expect(r.avisos.usouFapDefault).toBe(false)
      expect(r.avisos.usouTerceirosDefault).toBe(false)
    })

    // Verifica provisões presentes em todos os meses (>=15 dias)
    results.forEach((r, idx) => {
      const temProvisao = idx < 4 ? true : true // Maio tem 16 dias → >=15
      if (temProvisao) {
        expect(r.provisoes.decimoTerceiroMes).toBeGreaterThan(0)
        expect(r.provisoes.feriasMes).toBeGreaterThan(0)
        expect(r.provisoes.umTercoFeriasMes).toBeGreaterThan(0)
        expect(r.encargos.encargosSobre13).toBeGreaterThan(0)
        expect(r.encargos.encargosSobreFerias).toBeGreaterThan(0)
      }
    })

    // Verifica consistência de subtotais e total do mês: somar bases não arredondadas, arredondar no fim
    results.forEach((r) => {
      const { bases, encargos, provisoes, totais } = r
      // FGTS é arredondado a 2 casas na apresentação. Recalcula a base raw para validação: 8% * baseFGTS
      const fgtsRaw = 0.08 * bases.baseFGTS
      const encargosRaw = (
        (encargos.inssPatronal) +
        (encargos.rat) +
        (encargos.terceiros) +
        (fgtsRaw) +
        (encargos.encargosSobre13) +
        (encargos.encargosSobreFerias) +
        ((encargos.multaFGTSMes != null) ? (0.032 * bases.baseFGTS) : 0)
      )
      const provisoesRaw = (
        (provisoes.decimoTerceiroMes) +
        (provisoes.feriasMes) +
        (provisoes.umTercoFeriasMes) +
        (provisoes.fgtsSobreProvisoes)
      )
      closeTo(encargos.subtotalEncargos, Math.round(encargosRaw * 100)/100, 0.02)
      closeTo(provisoes.subtotalProvisoes, Math.round(provisoesRaw * 100)/100, 0.02)
      closeTo(totais.totalMes, Math.round((encargosRaw + provisoesRaw + bases.baseINSS) * 100)/100, 0.02)
    })

    // Maio: salário proporcional 16/31 → provisões existem (>=15)
    const maio = results[4]
    expect(maio.provisoes.decimoTerceiroMes).toBeGreaterThan(0)
    expect(maio.provisoes.feriasMes).toBeGreaterThan(0)
    expect(maio.provisoes.umTercoFeriasMes).toBeGreaterThan(0)
    expect(maio.encargos.encargosSobre13).toBeGreaterThan(0)
    expect(maio.encargos.encargosSobreFerias).toBeGreaterThan(0)
  })
})

