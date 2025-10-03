import { CompetenciaParams, DEFAULT_COMPETENCIA_PARAMS, diasNoMes, intersecaoDias, toUTC, addDays } from './competencia'
import { round, sumRounded } from '../utils/money'

export interface RescisaoResultado {
  mesesConsiderados13: number
  mesesConsideradosFerias: number
  decimoTerceiroProporcional: number
  feriasProporcionais: number
  tercoFerias: number
  fgtsSobreVerbas: number
  total: number
}

export interface RescisaoParams extends CompetenciaParams {
  considerarRegra15Dias?: boolean
}

function contarMesesProporcionais(
  inicio: Date,
  fimExclusive: Date,
  considerar15Dias: boolean,
): { meses13: number; mesesFerias: number; totalDias: number } {
  const start = toUTC(inicio)
  const end = toUTC(fimExclusive)
  let meses13 = 0
  let mesesFerias = 0
  let totalDias = 0

  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  while (cursor < end) {
    const ano = cursor.getUTCFullYear()
    const mes = cursor.getUTCMonth() + 1
    const diasMes = diasNoMes(ano, mes, 'calendario')
    const diasTrabalhados = intersecaoDias(start, end, ano, mes)
    if (diasTrabalhados > 0) {
      totalDias += diasTrabalhados
      if (!considerar15Dias || diasTrabalhados >= 15) {
        meses13 += 1
        mesesFerias += 1
      }
    }
    cursor = new Date(Date.UTC(ano, mes, 1))
  }

  return { meses13, mesesFerias, totalDias }
}

export function calcularRescisao(
  entrada: Date,
  saida: Date,
  salarioBase: number,
  params: RescisaoParams = DEFAULT_COMPETENCIA_PARAMS,
): RescisaoResultado {
  const rounding = (params.arredondamento ?? DEFAULT_COMPETENCIA_PARAMS.arredondamento)!
  const considerar15 = params.considerarRegra15Dias ?? true
  const inclusive = params.inclusiveEnd ?? DEFAULT_COMPETENCIA_PARAMS.inclusiveEnd!
  const fimExclusive = inclusive ? addDays(toUTC(saida), 1) : toUTC(saida)

  const { meses13, mesesFerias, totalDias } = contarMesesProporcionais(toUTC(entrada), fimExclusive, considerar15)

  const parcelaMensal = salarioBase / 12
  const decimo = round(parcelaMensal * meses13, rounding.casas, rounding.modo)

  let ferias = 0
  if ((params.feriasMetodologia ?? 'mensal') === 'diaria') {
    const totalDiasAno = 365
    const fator = totalDias / totalDiasAno
    ferias = round(parcelaMensal * 12 * fator / 12, rounding.casas, rounding.modo)
  } else {
    ferias = round(parcelaMensal * mesesFerias, rounding.casas, rounding.modo)
  }

  const terco = round(ferias / 3, rounding.casas, rounding.modo)
  const fgtsBase = decimo + ferias + terco
  const fgts = round(fgtsBase * (params.aliquotas?.fgts ?? DEFAULT_COMPETENCIA_PARAMS.aliquotas.fgts), rounding.casas, rounding.modo)
  const total = sumRounded([decimo, ferias, terco, fgts], rounding.casas, rounding.modo)

  return {
    mesesConsiderados13: meses13,
    mesesConsideradosFerias: mesesFerias,
    decimoTerceiroProporcional: decimo,
    feriasProporcionais: ferias,
    tercoFerias: terco,
    fgtsSobreVerbas: fgts,
    total,
  }
}
