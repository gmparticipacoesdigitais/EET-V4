import { dateOnly, daysInMonth, workedDaysInMonth } from './date'
import { applyProgressiveTable, TABELA_INSS, TABELA_IRRF } from './tables'

export function calcularFuncionario({ salario, adm, fim, params = {} }) {
  if (!adm || !fim) throw new Error('Datas inválidas')
  if (fim < adm) throw new Error('Data final anterior à entrada')

  const tablesINSS = params.TABELA_INSS || TABELA_INSS
  const tablesIRRF = params.TABELA_IRRF || TABELA_IRRF

  let totalSal = 0, totalFgts = 0, totalInss = 0, totalIrrf = 0
  let total13 = 0, totalFerias = 0, totalTerco = 0
  const mesesConsiderados = []
  const meses13 = []
  const mesesFerias = []

  const yStart = adm.getFullYear()
  const yEnd = fim.getFullYear()

  for (let y = yStart; y <= yEnd; y++) {
    const mStart = (y === yStart ? adm.getMonth() + 1 : 1)
    const mEnd = (y === yEnd ? fim.getMonth() + 1 : 12)
    for (let m = mStart; m <= mEnd; m++) {
      const dias = workedDaysInMonth(adm, fim, y, m)
      if (!dias) continue
      const dim = daysInMonth(y, m)
      const valorMes = dias >= dim ? salario : Math.min(salario, (salario / 30) * dias)
      totalSal += valorMes
      mesesConsiderados.push({ y, m, dias, valor: valorMes })
      // FGTS simples mensal
      totalFgts += 0.08 * valorMes
      // INSS/IRRF progressivos (se tabelas definidas)
      const inssMes = applyProgressiveTable(valorMes, tablesINSS[y] || tablesINSS.DEFAULT)
      const baseIrrf = Math.max(0, valorMes - inssMes)
      const irrfMes = applyProgressiveTable(baseIrrf, tablesIRRF[y] || tablesIRRF.DEFAULT)
      totalInss += inssMes
      totalIrrf += irrfMes
    }
  }

  // 13º proporcional (ano civil, meses com >=15 dias)
  for (let y = yStart; y <= yEnd; y++) {
    for (let m = 1; m <= 12; m++) {
      const dias = workedDaysInMonth(adm, fim, y, m)
      const contou = dias >= 15
      meses13.push({ y, m, contou, dias })
    }
  }
  const meses13Contados = meses13.filter(x => x.contou).length
  total13 = salario * (meses13Contados / 12)
  totalFgts += 0.08 * total13

  // Férias proporcionais + 1/3 (período aquisitivo corrente de 12 meses a partir da admissão)
  const aquisInicio = dateOnly(adm)
  const aquisFim = new Date(aquisInicio.getFullYear() + 1, aquisInicio.getMonth(), aquisInicio.getDate())
  for (let y = aquisInicio.getFullYear(); y <= aquisFim.getFullYear(); y++) {
    const mStart = (y === aquisInicio.getFullYear() ? aquisInicio.getMonth() + 1 : 1)
    const mEnd = (y === aquisFim.getFullYear() ? aquisFim.getMonth() + 1 : 12)
    for (let m = mStart; m <= mEnd; m++) {
      const dias = workedDaysInMonth(adm, fim, y, m)
      const contou = dias >= 15
      mesesFerias.push({ y, m, contou, dias })
    }
  }
  const mesesFeriasContados = mesesFerias.filter(x => x.contou).length
  totalFerias = salario * (mesesFeriasContados / 12)
  totalTerco = totalFerias / 3

  const up = (n) => Math.ceil((n || 0) * 100) / 100
  return {
    salario: up(totalSal),
    fgts: up(totalFgts),
    inss: up(totalInss),
    irrf: up(totalIrrf),
    decimoTerceiro: up(total13),
    ferias: up(totalFerias),
    tercoFerias: up(totalTerco),
    mesesConsiderados, meses13, mesesFerias,
  }
}

export function aggregateByVerba(funcionarios) {
  const acc = { salario: 0, fgts: 0, inss: 0, irrf: 0, decimoTerceiro: 0, ferias: 0, tercoFerias: 0, multaFgts40: 0, avisoPrevioInden: 0 }
  for (const f of funcionarios || []) {
    const c = f.calc
    if (!c) continue
    acc.salario += c.salario || 0
    acc.fgts += c.fgts || 0
    acc.inss += c.inss || 0
    acc.irrf += c.irrf || 0
    acc.decimoTerceiro += c.decimoTerceiro || 0
    acc.ferias += c.ferias || 0
    acc.tercoFerias += c.tercoFerias || 0
    acc.multaFgts40 += c.multaFgts40 || 0
    acc.avisoPrevioInden += c.avisoPrevioInden || 0
  }
  return acc
}
