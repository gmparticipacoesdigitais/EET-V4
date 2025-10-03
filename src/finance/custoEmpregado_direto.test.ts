import { describe, it, expect } from 'vitest'
import { calcularCustoEmpregadoMensalDireto } from './custoEmpregado'

function closeTo(value: number, expected: number, delta = 0.02) {
  expect(Math.abs(value - expected)).toBeLessThanOrEqual(delta)
}

describe('Custo Empregado CLT (direto) - Maria 2025', () => {
  const ratBase = 0.02
  const fap = 1.0
  const terceiros = 0.058

  it('enc13/encFerias existem quando há provisão e entram no subtotalEncargos', () => {
    const meses = [
      { diasNoMes: 31 },
      { diasNoMes: 28 },
      { diasNoMes: 31 },
      { diasNoMes: 30 },
      { diasNoMes: 31, diasTrabalhados: 16 },
    ]

    const results = meses.map(({ diasNoMes, diasTrabalhados }, idx) => {
      const salarioBase = 100_000
      const dias = diasTrabalhados ?? diasNoMes
      const salarioMes = idx < 4 ? salarioBase : (salarioBase * (16 / 31))
      return calcularCustoEmpregadoMensalDireto({
        salarioMes,
        diasTrabalhados: dias,
        diasNoMes,
        ratBase,
        fap,
        aliquotaTerceiros: terceiros,
        considerarMultaFGTS: false,
      })
    })

    results.forEach((r) => {
      // enc13/encFerias > 0 em todos (todos têm >=15 dias)
      expect(r.encargos.enc13).toBeGreaterThan(0)
      expect(r.encargos.encFerias).toBeGreaterThan(0)

      // Subtotal de encargos inclui enc13 e encFerias (e FGTS bruto, não o arredondado)
      const { inss, rat, terceiros, enc13, encFerias } = r.encargos
      const salarioMesRecon = r.totalMes - r.provisoes.subtotalProvisoes - r.encargos.subtotalEncargos
      const fgtsRaw = 0.08 * salarioMesRecon
      const subtotalEsperado = Math.round((inss + rat + terceiros + fgtsRaw + enc13 + encFerias) * 100) / 100
      closeTo(r.encargos.subtotalEncargos, subtotalEsperado, 0.02)

      const totalEsperado = Math.round((salarioMesRecon + r.encargos.subtotalEncargos + r.provisoes.subtotalProvisoes) * 100) / 100
      closeTo(r.totalMes, totalEsperado, 0.02)
    })
  })
})

