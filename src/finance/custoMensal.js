/**
 * Cálculo mensal de custo CLT (Brasil) com encargos sobre provisões.
 * Função pura em JavaScript com tipagem JSDoc.
 */

/**
 * Arredonda em modo half-up.
 * @param {number} value
 * @param {number} casas
 * @returns {number}
 */
export function roundHalfUp(value, casas) {
  if (!isFinite(value)) return 0
  const factor = Math.pow(10, casas)
  return Math.round(value * factor) / factor
}

/**
 * Normaliza para até 6 casas (half-up) para evitar propagação de dígitos.
 * @param {number} v
 * @returns {number}
 */
function norm6(v) {
  return roundHalfUp(Number(v) || 0, 6)
}

/**
 * @typedef {Object} CalcularCustoMensalParams
 * @property {number} salarioMes
 * @property {number} diasTrabalhados
 * @property {number} diasNoMes
 * @property {number} [ratBase] // 0.01 | 0.02 | 0.03 (default 0.02)
 * @property {number} [fap] // 0.50–2.00 (default 1.00)
 * @property {number} [aliquotaTerceiros] // e.g. 0.058 (default 0.058)
 * @property {boolean} [considerarMultaFGTS=false]
 */

/**
 * @typedef {Object} AvisosDefaults
 * @property {boolean} usouRatBaseDefault
 * @property {boolean} usouFapDefault
 * @property {boolean} usouTerceirosDefault
 * @property {string[]} mensagens
 */

/**
 * Calcula custo mensal CLT.
 * - Calcula tudo com 6 casas; arredonda para 2 apenas em fgts, subtotalEncargos, subtotalProvisoes e totalMes.
 * - Não soma valores já arredondados; somas usam bases não arredondadas.
 * - Regra dos 15: provisões apenas se diasTrabalhados >= 15.
 *
 * @param {CalcularCustoMensalParams} p
 * @returns {{
 *   bases: { baseINSS: number, baseFGTS: number, aliqEncargos: number },
 *   encargos: { inss: number, rat: number, terceiros: number, fgts: number, enc13: number, encFerias: number, multaFGTS: number, subtotalEncargos: number },
 *   provisoes: { decimoMes: number, feriasMes: number, umTercoMes: number, fgtsProvisoes: number, subtotalProvisoes: number },
 *   totais: { totalMes: number },
 *   avisos: AvisosDefaults
 * }}
 */
export function calcularCustoMensal(p) {
  const avisos = /** @type {AvisosDefaults} */ ({ usouRatBaseDefault: false, usouFapDefault: false, usouTerceirosDefault: false, mensagens: [] })

  const salarioMes = Number(p.salarioMes || 0)
  const diasTrabalhados = Number.isFinite(p.diasTrabalhados) ? Math.trunc(p.diasTrabalhados) : 0
  const diasNoMes = Number.isFinite(p.diasNoMes) ? Math.trunc(p.diasNoMes) : 0

  // Defaults seguros
  let ratBase = Number(p.ratBase)
  if (!isFinite(ratBase) || ratBase <= 0) {
    ratBase = 0.02
    avisos.usouRatBaseDefault = true
    avisos.mensagens.push('Usando ratBase padrão 2%')
  }
  let fap = Number(p.fap)
  if (!isFinite(fap) || fap <= 0) {
    fap = 1.0
    avisos.usouFapDefault = true
    avisos.mensagens.push('Usando FAP padrão 1,00')
  }
  let aliquotaTerceiros = Number(p.aliquotaTerceiros)
  if (!isFinite(aliquotaTerceiros) || aliquotaTerceiros <= 0) {
    aliquotaTerceiros = 0.058
    avisos.usouTerceirosDefault = true
    avisos.mensagens.push('Usando Terceiros padrão 5,8% (FPAS 515)')
  }

  const considerarMultaFGTS = Boolean(p.considerarMultaFGTS)

  // Bases
  const baseINSS = salarioMes
  const baseFGTS = salarioMes
  const geraProvisoes = diasTrabalhados >= 15
  const ratEfetivo = norm6(ratBase * fap)
  const aliqEncargos = norm6(0.20 + ratEfetivo + aliquotaTerceiros)

  // Encargos sobre salário (6 casas), fgts com apresentação 2 casas
  const inss = norm6(0.20 * baseINSS)
  const rat = norm6(ratEfetivo * baseINSS)
  const terceiros = norm6(aliquotaTerceiros * baseINSS)
  const fgtsRaw = norm6(0.08 * baseFGTS)
  const fgts = roundHalfUp(fgtsRaw, 2)

  // Provisões puras (se ≥15 dias)
  const decimoMes = geraProvisoes ? norm6(salarioMes / 12) : 0
  const feriasMes = geraProvisoes ? norm6(salarioMes / 12) : 0
  const umTercoMes = geraProvisoes ? norm6(feriasMes / 3) : 0
  const fgtsProvisoes = geraProvisoes ? norm6(0.08 * (decimoMes + feriasMes + umTercoMes)) : 0

  // Encargos sobre provisões (se ≥15 dias)
  const enc13 = geraProvisoes ? norm6(aliqEncargos * decimoMes) : 0
  const encFerias = geraProvisoes ? norm6(aliqEncargos * (feriasMes + umTercoMes)) : 0

  // Multa FGTS provisionada (opcional)
  const multaFGTSRaw = considerarMultaFGTS ? norm6(0.032 * baseFGTS) : 0
  const multaFGTS = roundHalfUp(multaFGTSRaw, 2)

  // Subtotais (somar bases não arredondadas; só arredondar o resultado final)
  const subtotalEncRaw = inss + rat + terceiros + fgtsRaw + enc13 + encFerias + multaFGTSRaw
  const subtotalEncargos = roundHalfUp(subtotalEncRaw, 2)
  const subtotalProvRaw = decimoMes + feriasMes + umTercoMes + fgtsProvisoes
  const subtotalProvisoes = roundHalfUp(subtotalProvRaw, 2)

  const totalMes = roundHalfUp(salarioMes + subtotalEncRaw + subtotalProvRaw, 2)

  return {
    bases: { baseINSS, baseFGTS, aliqEncargos },
    encargos: { inss, rat, terceiros, fgts, enc13, encFerias, multaFGTS, subtotalEncargos },
    provisoes: { decimoMes, feriasMes, umTercoMes, fgtsProvisoes, subtotalProvisoes },
    totais: { totalMes },
    avisos,
  }
}

