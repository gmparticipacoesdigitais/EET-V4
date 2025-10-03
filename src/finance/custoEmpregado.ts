/**
 * Módulo de custo de empregado mensal (CLT - Brasil)
 * Regras conforme especificação do usuário.
 *
 * - Entradas obrigatórias: salarioMes, diasTrabalhados, diasNoMes, cnae, fap, fpas
 * - Flags: considerarMultaFGTS (default false)
 * - Regra dos 15 dias: provisões (13º, férias, 1/3) apenas se diasTrabalhados >= 15
 * - Arredondamento: calcular com 6 casas; arredondar para 2 casas apenas em
 *   subtotalEncargos, subtotalProvisoes, fgts e totalMes. Não somar valores já
 *   arredondados; somar bases não arredondadas.
 */

/** @typedef {Object} CustoEmpregadoInput
 * @property {number} salarioMes - Salário do mês (já proporcional pelos dias trabalhados)
 * @property {number} diasTrabalhados - Dias trabalhados no mês (inteiro)
 * @property {number} diasNoMes - Dias no mês (inteiro)
 * @property {string} cnae - Código CNAE (string livre; heurística determina RAT base)
 * @property {number} fap - Fator Acidentário de Prevenção (0.50–2.00)
 * @property {string|number} fpas - Código FPAS (ex.: 515)
 * @property {boolean} [considerarMultaFGTS=false] - Se true, considera multa 3,2% do FGTS
 */

/** @typedef {Object} CustoEmpregadoAvisos
 * @property {boolean} usouRatBaseDefault
 * @property {boolean} usouFapDefault
 * @property {boolean} usouTerceirosDefault
 * @property {string[]} mensagens
 */

/** @typedef {Object} CustoEmpregadoOutput
 * @property {Object} bases
 * @property {number} bases.baseINSS
 * @property {number} bases.baseFGTS
 * @property {Object} encargos
 * @property {number} encargos.inssPatronal
 * @property {number} encargos.rat
 * @property {number} encargos.terceiros
 * @property {number} encargos.fgts - arredondado a 2 casas
 * @property {number} encargos.encargosSobre13
 * @property {number} encargos.encargosSobreFerias
 * @property {number} [encargos.multaFGTSMes] - arredondado a 2 casas, se considerarMultaFGTS
 * @property {number} encargos.subtotalEncargos - arredondado a 2 casas
 * @property {Object} provisoes
 * @property {number} provisoes.decimoTerceiroMes
 * @property {number} provisoes.feriasMes
 * @property {number} provisoes.umTercoFeriasMes
 * @property {number} provisoes.fgtsSobreProvisoes
 * @property {number} provisoes.subtotalProvisoes - arredondado a 2 casas
 * @property {Object} totais
 * @property {number} totais.totalMes - arredondado a 2 casas
 * @property {CustoEmpregadoAvisos} avisos
 */

/**
 * Arredonda com “half-up”.
 * @param {number} value
 * @param {number} casas
 */
function roundHalfUp(value, casas) {
  if (!isFinite(value)) return 0
  const factor = Math.pow(10, casas)
  return Math.round(value * factor) / factor
}

/**
 * Normaliza valor para até 6 casas (half-up), evitando propagação de dígitos.
 * @param {number} v
 */
function norm6(v) {
  return roundHalfUp(v, 6)
}

/**
 * Resolve alíquota de Terceiros por FPAS (mapa simples; default 0,058)
 * @param {string|number} fpas
 * @returns {{ aliquota: number, usedDefault: boolean }}
 */
export function resolveTerceirosPorFPAS(fpas) {
  const code = typeof fpas === 'string' ? parseInt(fpas.replace(/\D/g, ''), 10) : Number(fpas)
  const mapa = new Map([
    [515, 0.058],
    [507, 0.058],
    [531, 0.055],
  ])
  if (mapa.has(code)) return { aliquota: mapa.get(code), usedDefault: false }
  return { aliquota: 0.058, usedDefault: true }
}

/**
 * Resolve RAT base (0.01, 0.02, 0.03) a partir do CNAE (heurística simples).
 * - Seção de serviços profissionais (TI, etc.) → 1%
 * - Construção/indústria base/extrativas → 3%
 * - Demais → 2%
 * @param {string} cnae
 * @returns {{ ratBase: number, usedDefault: boolean }}
 */
export function resolveRatBasePorCNAE(cnae) {
  if (!cnae) return { ratBase: 0.02, usedDefault: true }
  const m = String(cnae).match(/(\d{2})/)
  const sec = m ? parseInt(m[1], 10) : NaN
  if (!isFinite(sec)) return { ratBase: 0.02, usedDefault: true }
  const baixo = new Set([62, 63, 64, 65, 66, 69, 70, 71, 72, 73])
  const alto = new Set([5, 6, 7, 8, 9, 10, 11, 41, 42, 43])
  if (baixo.has(sec)) return { ratBase: 0.01, usedDefault: false }
  if (alto.has(sec)) return { ratBase: 0.03, usedDefault: false }
  return { ratBase: 0.02, usedDefault: false }
}

/**
 * Calcula custo mensal CLT.
 * @param {CustoEmpregadoInput} input
 * @returns {CustoEmpregadoOutput}
 */
export function calcularCustoEmpregadoMensal(input) {
  const avisos = /** @type {CustoEmpregadoAvisos} */ ({ usouRatBaseDefault: false, usouFapDefault: false, usouTerceirosDefault: false, mensagens: [] })

  const salarioMes = Number(input.salarioMes || 0)
  const diasTrabalhados = Number.isFinite(input.diasTrabalhados) ? Math.trunc(input.diasTrabalhados) : 0
  const diasNoMes = Number.isFinite(input.diasNoMes) ? Math.trunc(input.diasNoMes) : 30

  // Defaults seguros
  const { ratBase, usedDefault: ratDefault } = resolveRatBasePorCNAE(String(input.cnae || ''))
  if (ratDefault) { avisos.usouRatBaseDefault = true; avisos.mensagens.push('Usando RAT base padrão 2% (sem CNAE reconhecido)') }

  const fap = Number.isFinite(input.fap) ? Number(input.fap) : 1.0
  if (!Number.isFinite(input.fap)) { avisos.usouFapDefault = true; avisos.mensagens.push('Usando FAP padrão 1,00') }

  const { aliquota, usedDefault: tercDefault } = resolveTerceirosPorFPAS(input.fpas)
  if (tercDefault) { avisos.usouTerceirosDefault = true; avisos.mensagens.push('Usando FPAS padrão (515) para Terceiros ~5,8%') }

  // Regras
  const geraProvisoes = diasTrabalhados >= 15
  const baseINSS = salarioMes
  const baseFGTS = salarioMes
  const ratEfetivo = norm6(ratBase * fap)

  // Encargos sobre salário (brutos, 6 casas)
  const inssPatronal = norm6(0.20 * baseINSS)
  const rat = norm6(ratEfetivo * baseINSS)
  const terceiros = norm6(aliquota * baseINSS)
  const fgtsRaw = norm6(0.08 * baseFGTS)
  const fgts = roundHalfUp(fgtsRaw, 2) // apresentação em 2 casas

  // Provisões puras (se ≥15 dias)
  const decimoTerceiroMes = geraProvisoes ? norm6(baseINSS / 12) : 0
  const feriasMes = geraProvisoes ? norm6(baseINSS / 12) : 0
  const umTercoFeriasMes = geraProvisoes ? norm6(feriasMes / 3) : 0
  const fgtsSobreProvisoes = geraProvisoes ? norm6(0.08 * (decimoTerceiroMes + feriasMes + umTercoFeriasMes)) : 0

  // Encargos sobre provisões (se ≥15 dias)
  const aliqEncargos = norm6(0.20 + ratEfetivo + aliquota)
  const encargosSobre13 = geraProvisoes ? norm6(aliqEncargos * decimoTerceiroMes) : 0
  const encargosSobreFerias = geraProvisoes ? norm6(aliqEncargos * (feriasMes + umTercoFeriasMes)) : 0

  // Multa FGTS provisionada (opcional) – apresentação 2 casas, soma usa base não arredondada
  const considerarMultaFGTS = Boolean(input.considerarMultaFGTS)
  const multaFGTSRaw = considerarMultaFGTS ? norm6(0.032 * baseFGTS) : 0
  const multaFGTSMes = considerarMultaFGTS ? roundHalfUp(multaFGTSRaw, 2) : undefined

  // Subtotais (somar base não arredondada, arredondar resultado)
  const subtotalEncargosRaw = inssPatronal + rat + terceiros + fgtsRaw + encargosSobre13 + encargosSobreFerias + (multaFGTSRaw || 0)
  const subtotalEncargos = roundHalfUp(subtotalEncargosRaw, 2)

  const subtotalProvisoesRaw = decimoTerceiroMes + feriasMes + umTercoFeriasMes + fgtsSobreProvisoes
  const subtotalProvisoes = roundHalfUp(subtotalProvisoesRaw, 2)

  const totalMes = roundHalfUp(subtotalEncargosRaw + subtotalProvisoesRaw + salarioMes, 2)

  return {
    bases: { baseINSS, baseFGTS },
    encargos: { inssPatronal, rat, terceiros, fgts, encargosSobre13, encargosSobreFerias, ...(multaFGTSMes != null ? { multaFGTSMes } : {}), subtotalEncargos },
    provisoes: { decimoTerceiroMes, feriasMes, umTercoFeriasMes, fgtsSobreProvisoes, subtotalProvisoes },
    totais: { totalMes },
    avisos,
  }
}

/**
 * Entradas diretas (sem resolver CNAE/FPAS):
 * @typedef {Object} CustoDiretoInput
 * @property {number} salarioMes
 * @property {number} diasTrabalhados
 * @property {number} diasNoMes
 * @property {number} ratBase // 0.01 | 0.02 | 0.03
 * @property {number} fap // 0.50–2.00
 * @property {number} aliquotaTerceiros // ex.: 0.058 (FPAS 515)
 * @property {boolean} [considerarMultaFGTS]
 */

/**
 * Calcula custo mensal CLT com entradas diretas (ratBase/fap/terceiros).
 * @param {CustoDiretoInput} input
 * @returns {{
 *  encargos: { inss: number, rat: number, terceiros: number, fgts: number, enc13: number, encFerias: number, multaFGTS?: number, subtotalEncargos: number },
 *  provisoes: { decimoMes: number, feriasMes: number, umTercoMes: number, fgtsProvisoes: number, subtotalProvisoes: number },
 *  totalMes: number
 * }}
 */
export function calcularCustoEmpregadoMensalDireto(input) {
  const salarioMes = Number(input.salarioMes || 0)
  const diasTrabalhados = Number.isFinite(input.diasTrabalhados) ? Math.trunc(input.diasTrabalhados) : 0
  const diasNoMes = Number.isFinite(input.diasNoMes) ? Math.trunc(input.diasNoMes) : 0
  const ratBase = Number(input.ratBase)
  const fap = Number(input.fap)
  const aliquotaTerceiros = Number(input.aliquotaTerceiros)
  const considerarMulta = Boolean(input.considerarMultaFGTS)

  const geraProvisoes = diasTrabalhados >= 15
  const ratEfetivo = norm6(ratBase * fap)

  // Encargos sobre salário (brutos 6 casas)
  const inss = norm6(0.20 * salarioMes)
  const rat = norm6(ratEfetivo * salarioMes)
  const terceiros = norm6(aliquotaTerceiros * salarioMes)
  const fgtsRaw = norm6(0.08 * salarioMes)
  const fgts = roundHalfUp(fgtsRaw, 2)

  // Provisões (se ≥15 dias)
  const decimoMes = geraProvisoes ? norm6(salarioMes / 12) : 0
  const feriasMes = geraProvisoes ? norm6(salarioMes / 12) : 0
  const umTercoMes = geraProvisoes ? norm6(feriasMes / 3) : 0
  const fgtsProvisoes = geraProvisoes ? norm6(0.08 * (decimoMes + feriasMes + umTercoMes)) : 0

  // Encargos sobre provisões
  const aliqEnc = norm6(0.20 + ratEfetivo + aliquotaTerceiros)
  const enc13 = geraProvisoes ? norm6(aliqEnc * decimoMes) : 0
  const encFerias = geraProvisoes ? norm6(aliqEnc * (feriasMes + umTercoMes)) : 0

  // Multa FGTS provisionada (opcional)
  const multaFGTSRaw = considerarMulta ? norm6(0.032 * salarioMes) : 0
  const multaFGTS = considerarMulta ? roundHalfUp(multaFGTSRaw, 2) : undefined

  // Subtotais em 2 casas, somando bases brutas
  const subtotalEncRaw = inss + rat + terceiros + fgtsRaw + enc13 + encFerias + (multaFGTSRaw || 0)
  const subtotalEncargos = roundHalfUp(subtotalEncRaw, 2)
  const subtotalProvRaw = decimoMes + feriasMes + umTercoMes + fgtsProvisoes
  const subtotalProvisoes = roundHalfUp(subtotalProvRaw, 2)
  const totalMes = roundHalfUp(salarioMes + subtotalEncRaw + subtotalProvRaw, 2)

  return {
    encargos: { inss, rat, terceiros, fgts, enc13, encFerias, ...(multaFGTS != null ? { multaFGTS } : {}), subtotalEncargos },
    provisoes: { decimoMes, feriasMes, umTercoMes, fgtsProvisoes, subtotalProvisoes },
    totalMes,
  }
}
