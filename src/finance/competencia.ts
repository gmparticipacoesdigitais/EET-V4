import { round, sumRounded, RoundingMode } from '../utils/money'

const DAY_MS = 24 * 60 * 60 * 1000

export type BaseDias = 'calendario' | 'comercial30'
export type FeriasMetodologia = 'mensal' | 'diaria'

export interface AliquotasEncargos {
  inssPatronal: number
  rat: number
  terceiros: number
  fgts: number
}

export interface RoundingConfig {
  casas: number
  modo: RoundingMode
}

export interface CompetenciaParams {
  aliquotas: AliquotasEncargos
  provisionarMesParcial?: boolean
  feriasMetodologia?: FeriasMetodologia
  baseDias?: BaseDias
  inclusiveEnd?: boolean
  arredondamento?: RoundingConfig
  moeda?: string
  // Novos parâmetros para maior confiabilidade
  cnae?: string // usado para achar RAT (1%–3%) quando possível
  fap?: number // 0.50–2.00 (multiplica o RAT do CNAE)
  fpas?: number // para mapear Terceiros (% via FPAS), ex.: 515 ~ 5.8%
  adicionaisBaseINSSFGTS?: number // adicionais/comissões que entram na base (insalubr., periculos., noturno etc.)
  // Flags rápidas (liga/desliga)
  inssAtivo?: boolean
  fgtsAtivo?: boolean
  terceirosAtivo?: boolean
  ratAtivo?: boolean
  // Regra dos 15 dias apenas para 13º/férias/1/3
  usarRegra15Dias?: boolean
  // Multa FGTS provisionada (3,2% da base FGTS do mês)
  provisionarMultaFgts32?: boolean
  // Encargos (INSS + RAT + Terceiros) sobre provisões (13º/férias/1/3)
  incluirEncargosSobreProvisoes?: boolean
}

export interface EncargosResultado {
  inss: number
  fgts: number
  terceiros: number
  rat: number
  total: number
}

export interface ProvisoesResultado {
  decimoTerceiro: number
  ferias: number
  tercoFerias: number
  fgtsProvisoes: number
  total: number
  fatorProporcional: number
}

export interface MesResultado {
  ano: number
  mes: number
  competenciaId: string
  label: string
  diasNoMes: number
  diasTrabalhados: number
  salarioCompetencia: number
  encargos: EncargosResultado
  provisoes: ProvisoesResultado
  encargosProvisoes?: number
  multaFgts32?: number
  totalMes: number
  baseFator: number
  provisionado: boolean
  avisos?: string[]
}

export interface PeriodoResultado {
  meses: MesResultado[]
  totais: {
    salario: number
    encargos: number
    provisoes: number
    periodo: number
  }
}

export const DEFAULT_COMPETENCIA_PARAMS: CompetenciaParams = {
  aliquotas: { inssPatronal: 0.2, rat: 0.02, terceiros: 0.058, fgts: 0.08 },
  provisionarMesParcial: true,
  feriasMetodologia: 'mensal',
  baseDias: 'calendario',
  inclusiveEnd: true,
  moeda: 'BRL',
  arredondamento: { casas: 2, modo: 'half-even' },
  fap: 1.0,
  fpas: 515,
  inssAtivo: true,
  fgtsAtivo: true,
  terceirosAtivo: true,
  ratAtivo: true,
  usarRegra15Dias: false,
  provisionarMultaFgts32: false,
  incluirEncargosSobreProvisoes: false,
}

export function diasNoMes(ano: number, mes: number, base: BaseDias = 'calendario'): number {
  if (base === 'comercial30') return 30
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate()
}

export function toUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

export function intersecaoDias(
  inicioUTC: Date,
  fimExclusiveUTC: Date,
  ano: number,
  mes: number,
): number {
  const mesInicio = new Date(Date.UTC(ano, mes - 1, 1))
  const mesFimExclusive = new Date(Date.UTC(ano, mes, 1))
  const inicio = inicioUTC > mesInicio ? inicioUTC : mesInicio
  const fim = fimExclusiveUTC < mesFimExclusive ? fimExclusiveUTC : mesFimExclusive
  if (fim <= inicio) return 0
  return Math.round((fim.getTime() - inicio.getTime()) / DAY_MS)
}

// Mapeamento simples FPAS -> % Terceiros (ponto de partida; expandir conforme necessidade)
function terceirosPorFPAS(fpas?: number): number | undefined {
  const mapa: Record<number, number> = {
    515: 0.058, // comércio
    // Exemplos adicionais (ajuste conforme legislação aplicável):
    507: 0.058,
    531: 0.055,
  }
  if (!fpas) return undefined
  return mapa[fpas]
}

// Heurística simples para RAT por CNAE: usa dois primeiros dígitos como aproximação do grau de risco
// (1% baixo risco, 2% médio, 3% alto). Se não reconhecido, retorna undefined.
function ratPorCNAE(cnae?: string): number | undefined {
  if (!cnae) return undefined
  const m = cnae.match(/(\d{2})/)
  const sec = m ? parseInt(m[1], 10) : NaN
  if (!isFinite(sec)) return undefined
  // Mapeamento reduzido e opinativo; refine com tabela oficial quando disponível
  const baixo = new Set([62, 63, 64, 65, 66, 69, 70, 71, 72, 73]) // TI/Serviços profissionais
  const alto = new Set([5, 6, 7, 8, 9, 10, 11, 41, 42, 43])   // extração, indústria base, construção
  if (baixo.has(sec)) return 0.01
  if (alto.has(sec)) return 0.03
  return 0.02
}

function obterAliquotasEfetivas(
  params: CompetenciaParams,
): { inss: number; fgts: number; terceiros: number; ratEfetivo: number; avisos: string[] } {
  const avisos: string[] = []
  const baseAliq = params.aliquotas || DEFAULT_COMPETENCIA_PARAMS.aliquotas!
  // INSS/FGTS permanecem conforme informado (ou defaults)
  const inss = baseAliq.inssPatronal
  const fgts = baseAliq.fgts

  // Terceiros via FPAS (fallback para aliquota informada)
  let terceiros = baseAliq.terceiros
  const tFPAS = terceirosPorFPAS(params.fpas)
  if (typeof tFPAS === 'number') {
    terceiros = tFPAS
  } else if (params.fpas == null) {
    avisos.push('Usando FPAS padrão (515) para Terceiros ~5,8%')
  }

  // RAT efetivo = RAT(CNAE) * FAP, com fallback no informado
  const ratBase = ratPorCNAE(params.cnae)
  const fap = params.fap ?? 1.0
  let ratEfetivo = (typeof ratBase === 'number' ? ratBase : baseAliq.rat) * fap
  if (params.cnae == null) avisos.push('Usando RAT padrão 2% (sem CNAE)')
  if (params.fap == null) avisos.push('Usando FAP padrão 1,00')

  return { inss, fgts, terceiros, ratEfetivo, avisos }
}

function obterRounding(params?: CompetenciaParams): RoundingConfig {
  return params?.arredondamento ?? DEFAULT_COMPETENCIA_PARAMS.arredondamento!
}

function fatorMesParcial(
  diasTrabalhados: number,
  diasBase: number,
  provisionarParcial: boolean,
): { fatorSalario: number; fatorProvisoes: number; provisionado: boolean } {
  const full = diasTrabalhados >= diasBase
  const fator = full ? 1 : diasBase === 0 ? 0 : diasTrabalhados / diasBase
  if (full) return { fatorSalario: 1, fatorProvisoes: 1, provisionado: true }
  if (!provisionarParcial) return { fatorSalario: Math.min(1, fator), fatorProvisoes: 0, provisionado: false }
  return { fatorSalario: Math.min(1, fator), fatorProvisoes: fator, provisionado: true }
}

export function calcularSalarioCompetencia(
  salarioBase: number,
  fator: number,
  arredondamento: RoundingConfig,
): number {
  return round(salarioBase * fator, arredondamento.casas, arredondamento.modo)
}

export function calcularEncargos(
  salarioCompetencia: number,
  aliquotas: AliquotasEncargos,
  arredondamento: RoundingConfig,
): EncargosResultado {
  const { casas, modo } = arredondamento
  const inss = round(salarioCompetencia * aliquotas.inssPatronal, casas, modo)
  const fgts = round(salarioCompetencia * aliquotas.fgts, casas, modo)
  const terceiros = round(salarioCompetencia * aliquotas.terceiros, casas, modo)
  const rat = round(salarioCompetencia * aliquotas.rat, casas, modo)
  const total = sumRounded([inss, fgts, terceiros, rat], casas, modo)
  return { inss, fgts, terceiros, rat, total }
}

export function calcularProvisoes(
  salarioBase: number,
  fatorProvisoes: number,
  aliquotaFgts: number,
  arredondamento: RoundingConfig,
  feriasMetodologia: FeriasMetodologia = 'mensal',
  diasTrabalhados?: number,
  diasBase?: number,
): ProvisoesResultado {
  const { casas, modo } = arredondamento
  let baseProporcional = fatorProvisoes
  if (feriasMetodologia === 'diaria' && diasTrabalhados != null && diasBase && diasBase > 0) {
    baseProporcional = diasTrabalhados / diasBase
  }
  // Arredonda a parcela mensal para evitar propagação de casas infinitas (ex.: 100000/12)
  const parcelaMensal = round(salarioBase / 12, casas, modo)
  // Calcula valores brutos e aplica arredondamento ao expor e ao total (half-up)
  const decimoRaw = parcelaMensal * baseProporcional
  const feriasRaw = parcelaMensal * baseProporcional
  const tercoRaw = feriasRaw / 3
  const fgtsProvRaw = (decimoRaw + feriasRaw + tercoRaw) * aliquotaFgts
  const total = sumRounded([
    round(decimoRaw, casas, modo),
    round(feriasRaw, casas, modo),
    round(tercoRaw, casas, modo),
    round(fgtsProvRaw, casas, modo),
  ], casas, modo)
  return {
    decimoTerceiro: round(decimoRaw, casas, modo),
    ferias: round(feriasRaw, casas, modo),
    tercoFerias: round(tercoRaw, casas, modo),
    fgtsProvisoes: round(fgtsProvRaw, casas, modo),
    total,
    fatorProporcional: baseProporcional,
  }
}

export function calcularMes(
  inicio: Date,
  fimExclusive: Date,
  ano: number,
  mes: number,
  salarioBase: number,
  params: CompetenciaParams = DEFAULT_COMPETENCIA_PARAMS,
): MesResultado | null {
  const rounding = obterRounding(params)
  const baseDias = params.baseDias ?? DEFAULT_COMPETENCIA_PARAMS.baseDias!
  const diasBase = diasNoMes(ano, mes, baseDias)
  const diasTrabalhados = intersecaoDias(inicio, fimExclusive, ano, mes)
  if (diasTrabalhados <= 0) return null

  const provisionar = params.provisionarMesParcial ?? DEFAULT_COMPETENCIA_PARAMS.provisionarMesParcial!
  const feriasMet = params.feriasMetodologia ?? DEFAULT_COMPETENCIA_PARAMS.feriasMetodologia!
  const usarRegra15 = params.usarRegra15Dias ?? DEFAULT_COMPETENCIA_PARAMS.usarRegra15Dias!

  const fatores = fatorMesParcial(diasTrabalhados, diasBase, provisionar)
  const salarioCompetencia = calcularSalarioCompetencia(salarioBase, fatores.fatorSalario, rounding)

  // Bases e alíquotas efetivas (CNAE/FAP/FPAS)
  const { inss, fgts, terceiros, ratEfetivo, avisos: avisosAliq } = obterAliquotasEfetivas(params)
  const adicionais = params.adicionaisBaseINSSFGTS || 0
  const baseEncargos = salarioCompetencia + adicionais

  // Aplica flags on/off
  const inssAtivo = params.inssAtivo ?? true
  const fgtsAtivo = params.fgtsAtivo ?? true
  const terceirosAtivo = params.terceirosAtivo ?? true
  const ratAtivo = params.ratAtivo ?? true

  const encargos = (() => {
    const aliq: AliquotasEncargos = {
      inssPatronal: inssAtivo ? inss : 0,
      fgts: fgtsAtivo ? fgts : 0,
      terceiros: terceirosAtivo ? terceiros : 0,
      rat: ratAtivo ? ratEfetivo : 0,
    }
    return calcularEncargos(baseEncargos, aliq, rounding)
  })()

  // Provisões com trava de 15 dias (1/12) quando metodologia mensal
  const fatorProvisoes = (() => {
    if (feriasMet === 'mensal') {
      const contaMes = usarRegra15 ? (diasTrabalhados >= 15 ? 1 : 0) : Math.min(1, fatores.fatorProvisoes)
      return contaMes
    }
    return Math.min(1, fatores.fatorProvisoes)
  })()

  const provisoes = fatorProvisoes > 0
    ? calcularProvisoes(salarioBase, fatorProvisoes, fgtsAtivo ? fgts : 0, rounding, feriasMet, diasTrabalhados, diasBase)
    : { decimoTerceiro: 0, ferias: 0, tercoFerias: 0, fgtsProvisoes: 0, total: 0, fatorProporcional: fatorProvisoes }

  // Encargos sobre provisões (INSS + RAT + Terceiros sobre 13º e Férias+1/3)
  const baseEncProvisoes = provisoes.decimoTerceiro + provisoes.ferias + provisoes.tercoFerias
  const encargosProvisoesRaw = baseEncProvisoes * ((inssAtivo ? inss : 0) + (ratAtivo ? ratEfetivo : 0) + (terceirosAtivo ? terceiros : 0))
  const incluirEncProv = params.incluirEncargosSobreProvisoes ?? false
  const encargosProvisoes = incluirEncProv ? round(encargosProvisoesRaw, rounding.casas, rounding.modo) : 0

  // Multa FGTS provisionada (~3,2% da base FGTS do mês)
  const multaFgts32 = (params.provisionarMultaFgts32 ? round(baseEncargos * 0.032, rounding.casas, rounding.modo) : 0)

  const totalMes = round(encargos.total + provisoes.total + (incluirEncProv ? encargosProvisoes : 0) + multaFgts32, rounding.casas, rounding.modo)
  const competenciaId = `${ano}-${String(mes).padStart(2, '0')}`
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(ano, mes - 1, 1)),
  )

  const avisos: string[] = [...avisosAliq]

  return {
    ano,
    mes,
    competenciaId,
    label,
    diasNoMes: diasBase,
    diasTrabalhados,
    salarioCompetencia,
    encargos,
    provisoes,
    encargosProvisoes: incluirEncProv ? encargosProvisoes : undefined,
    multaFgts32,
    totalMes,
    baseFator: fatores.fatorSalario,
    provisionado: fatores.provisionado,
    avisos: avisos.length ? avisos : undefined,
  }
}

export function calcularPeriodo(
  entrada: Date,
  saida?: Date,
  salarioBase?: number,
  params: CompetenciaParams = DEFAULT_COMPETENCIA_PARAMS,
): PeriodoResultado {
  const rounding = obterRounding(params)
  const salario = salarioBase ?? 0
  const inicioUTC = toUTC(entrada)
  const inclusive = params.inclusiveEnd ?? DEFAULT_COMPETENCIA_PARAMS.inclusiveEnd!
  const fimReferencia = saida ? toUTC(saida) : toUTC(new Date())
  const fimExclusiveUTC = inclusive ? addDays(fimReferencia, 1) : fimReferencia

  const meses: MesResultado[] = []
  let cursor = new Date(Date.UTC(inicioUTC.getUTCFullYear(), inicioUTC.getUTCMonth(), 1))

  while (cursor < fimExclusiveUTC) {
    const ano = cursor.getUTCFullYear()
    const mes = cursor.getUTCMonth() + 1
    const resultadoMes = calcularMes(inicioUTC, fimExclusiveUTC, ano, mes, salario, params)
    if (resultadoMes) meses.push(resultadoMes)
    cursor = new Date(Date.UTC(ano, mes, 1))
  }

  const totalSalario = sumRounded(meses.map((m) => m.salarioCompetencia), rounding.casas, rounding.modo)
  const totalEncargos = sumRounded(meses.map((m) => m.encargos.total), rounding.casas, rounding.modo)
  const totalProvisoes = sumRounded(meses.map((m) => m.provisoes.total + (m.encargosProvisoes || 0) + (m.multaFgts32 || 0)), rounding.casas, rounding.modo)
  const totalPeriodo = meses.reduce((acc, m) => acc + (m.totalMes || 0), 0)

  return {
    meses,
    totais: { salario: totalSalario, encargos: totalEncargos, provisoes: totalProvisoes, periodo: totalPeriodo },
  }
}
