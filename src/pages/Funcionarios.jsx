import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Card from '../components/Card'
import Input from '../components/Input'
import Select from '../components/Select'
import DateField from '../components/DateField'
import Button from '../components/Button'
import EncargosPie from '../components/EncargosPie'
import { labelCpfCnpj, formatCpfCnpj, onlyDigits, isValidCPF, isValidCNPJ } from '../utils/br'
import { parseYMD } from '../calc/date'
import { calcularFuncionario, aggregateByVerba } from '../calc/compute'
import { upsertEmployee } from '../data/employees'
import { useAuth } from '../auth/AuthContext'
import { calcularPeriodo, DEFAULT_COMPETENCIA_PARAMS } from '../finance/competencia'
import '../styles/employees.css'

const ENCARGOS_POR_SETOR = {
  comercio: { inss: 0.20, fgts: 0.08, terceiros: 0.058, rat: 0.02 },
  industria:{ inss: 0.20, fgts: 0.08, terceiros: 0.038, rat: 0.03 },
  servicos: { inss: 0.20, fgts: 0.08, terceiros: 0.048, rat: 0.01 }
}

const DEFAULT_CALC_CONFIG = {
  provisionarMesParcial: true,
  baseDias: 'calendario',
  feriasMetodologia: 'mensal'
}

function buildFinanceParams(funcionario, config) {
  const setor = ENCARGOS_POR_SETOR[funcionario.setor] || ENCARGOS_POR_SETOR.comercio
  return {
    ...DEFAULT_COMPETENCIA_PARAMS,
    aliquotas: {
      inssPatronal: setor.inss,
      fgts: setor.fgts,
      terceiros: setor.terceiros,
      rat: setor.rat,
    },
    provisionarMesParcial: config.provisionarMesParcial,
    baseDias: config.baseDias,
    feriasMetodologia: config.feriasMetodologia,
  }
}

function calcularRelatorioCompleto(funcionario, config) {
  const dataEntrada = parseYMD(funcionario.dataEntrada)
  if (!dataEntrada) return { meses: [], totais: { salario: 0, encargos: 0, provisoes: 0, periodo: 0 } }
  const dataSaida = funcionario.dataSaida ? parseYMD(funcionario.dataSaida) : new Date()
  const params = buildFinanceParams(funcionario, config)
  const salarioBase = Number(funcionario.salarioBase ?? 0)
  const periodo = calcularPeriodo(dataEntrada, dataSaida, salarioBase, params)
  return periodo
}

function atualizarFuncionarioFinanceiro(funcionario, config) {
  const periodo = calcularRelatorioCompleto(funcionario, config)
  return {
    ...funcionario,
    relatorioMensal: periodo.meses,
    financeiroTotais: periodo.totais,
    financeiroConfig: { ...config },
  }
}

export default function FuncionariosPage() {
  const { funcionarios, setFuncionarios } = useOutletContext()
  const { user } = useAuth()
  const [formData, setFormData] = useState({ nome: '', cargo: '', salarioBase: '', dataEntrada: '', dataSaida: '', setor: 'comercio', cpfCnpj: '' })
  const [errors, setErrors] = useState({ cpfCnpj: '' })
  const [dateErrors, setDateErrors] = useState({ entrada: '', saida: '' })
  const [calcConfig, setCalcConfig] = useState(DEFAULT_CALC_CONFIG)
  const [searchTerm, setSearchTerm] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    setFuncionarios((prev) => prev.map((f) => atualizarFuncionarioFinanceiro(f, calcConfig)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'cpfCnpj') {
      const masked = formatCpfCnpj(value)
      const digits = onlyDigits(masked)
      let err = ''
      if (digits.length > 0) {
        const isCpf = digits.length === 11
        const isCnpj = digits.length === 14
        if (!isCpf && !isCnpj) err = 'Informe CPF (11) ou CNPJ (14)'
        else if (isCpf && !isValidCPF(digits)) err = 'CPF inválido'
        else if (isCnpj && !isValidCNPJ(digits)) err = 'CNPJ inválido'
      }
      setErrors(prev => ({ ...prev, cpfCnpj: err }))
      return setFormData(prev => ({ ...prev, [name]: masked }))
    }
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Validate dates locally to avoid timezone issues
    const adm = parseYMD(formData.dataEntrada)
    const fim = formData.dataSaida ? parseYMD(formData.dataSaida) : new Date()
    const de = { entrada: '', saida: '' }
    if (!adm) de.entrada = 'Data de entrada inválida'
    if (formData.dataSaida && !fim) de.saida = 'Data final inválida'
    if (adm && fim && fim < adm) de.saida = 'Data final anterior à entrada'
    setDateErrors(de)
    if (de.entrada || de.saida) return
    const digits = onlyDigits(formData.cpfCnpj)
    let err = ''
    if (digits.length > 0) {
      const isCpf = digits.length === 11
      const isCnpj = digits.length === 14
      if (!isCpf && !isCnpj) err = 'Informe CPF (11) ou CNPJ (14)'
      else if (isCpf && !isValidCPF(digits)) err = 'CPF inválido'
      else if (isCnpj && !isValidCNPJ(digits)) err = 'CNPJ inválido'
    }
    setErrors(prev => ({ ...prev, cpfCnpj: err }))
    if (err) return
    // deduplicate by (nome + dataEntrada + dataSaida)
    const dup = (funcionarios || []).some(f =>
      f.nome.trim().toLowerCase() === formData.nome.trim().toLowerCase() &&
      String(f.dataEntrada || '') === String(formData.dataEntrada || '') &&
      String(f.dataSaida || '') === String(formData.dataSaida || '')
    )
    if (dup) return

    const novoFuncionario = {
      ...formData,
      id: Date.now(),
      salarioBase: parseFloat(formData.salarioBase),
      cpfCnpj: digits || undefined,
      relatorioMensal: [],
    }
    const atualizado = atualizarFuncionarioFinanceiro(novoFuncionario, calcConfig)
    try {
      const admLocal = parseYMD(atualizado.dataEntrada)
      const fimLocal = atualizado.dataSaida ? parseYMD(atualizado.dataSaida) : new Date()
      atualizado.calc = calcularFuncionario({ salario: atualizado.salarioBase, adm: admLocal, fim: fimLocal, params: {} })
    } catch {}
    setFuncionarios(prev => [ ...prev, atualizado ])
    // persist for current user
    if (user?.uid) {
      upsertEmployee(user.uid, atualizado).catch(() => {})
    }
    setFormData({ nome: '', cargo: '', salarioBase: '', dataEntrada: '', dataSaida: '', setor: 'comercio', cpfCnpj: '' })
  }

  const handleConfigChange = (e) => {
    const { name, value } = e.target
    setCalcConfig((prev) => {
      const next = {
        ...prev,
        [name]: name === 'provisionarMesParcial' ? value === 'true' : value,
      }
      setFuncionarios((prevFunc) => prevFunc.map((f) => atualizarFuncionarioFinanceiro(f, next)))
      return next
    })
  }

  const filteredFuncionarios = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return funcionarios
    return funcionarios.filter((f) => {
      const nome = f.nome || ''
      const cargo = f.cargo || ''
      return nome.toLowerCase().includes(term) || cargo.toLowerCase().includes(term)
    })
  }, [funcionarios, searchTerm])

  const globalTotals = useMemo(() => {
    return filteredFuncionarios.reduce((acc, f) => {
      const tot = f.financeiroTotais || { salario: 0, encargos: 0, provisoes: 0, periodo: 0 }
      acc.salario += tot.salario || 0
      acc.encargos += tot.encargos || 0
      acc.provisoes += tot.provisoes || 0
      acc.periodo += tot.periodo || 0
      return acc
    }, { salario: 0, encargos: 0, provisoes: 0, periodo: 0 })
  }, [filteredFuncionarios])

  const summaryMetrics = useMemo(() => {
    const total = filteredFuncionarios.length
    const ativos = filteredFuncionarios.filter((f) => {
      if (!f.dataSaida) return true
      const saida = parseYMD(f.dataSaida)
      return !saida || saida >= new Date()
    }).length
    const folha = globalTotals.periodo
    const encargos = globalTotals.encargos
    const provisoes = globalTotals.provisoes
    return {
      headcount: total,
      ativos,
      folha,
      encargos,
      provisoes,
      mediaFolha: total ? folha / total : 0,
      mediaEncargos: total ? encargos / total : 0,
      mediaProvisoes: total ? provisoes / total : 0,
    }
  }, [filteredFuncionarios, globalTotals])

  const globalPieData = useMemo(() => {
    const t = filteredFuncionarios.length ? aggregateByVerba(filteredFuncionarios) : { salario: 0, fgts: 0, inss: 0, irrf: 0, decimoTerceiro: 0, ferias: 0, tercoFerias: 0, multaFgts40: 0 }
    return [
      { name: 'Salário', value: t.salario },
      { name: 'FGTS', value: t.fgts },
      { name: 'INSS', value: t.inss },
      { name: 'IRRF', value: t.irrf },
      { name: '13º', value: t.decimoTerceiro },
      { name: 'Férias', value: t.ferias },
      { name: '1/3 Férias', value: t.tercoFerias },
      t.multaFgts40 ? { name: 'Multa FGTS 40%', value: t.multaFgts40 } : null,
    ].filter(Boolean)
  }, [filteredFuncionarios])

  const handleScrollToForm = () => {
    if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="employees-page">
      <header className="employees-hero">
        <div className="employees-hero__copy">
          <span className="employees-hero__badge">Visão operacional</span>
          <h1>Funcionários e encargos</h1>
          <p>Visualize despesas trabalhistas por competência, ajuste políticas de provisão e mantenha sua folha sempre pronta.</p>
          <ul className="employees-hero__highlights">
            <li>
              <strong>{summaryMetrics.ativos}</strong>
              <span>Ativos</span>
            </li>
            <li>
              <strong>{formatCurrency(summaryMetrics.folha)}</strong>
              <span>Folha estimada</span>
            </li>
            <li>
              <strong>{formatCurrency(summaryMetrics.encargos + summaryMetrics.provisoes)}</strong>
              <span>Encargos + provisões</span>
            </li>
          </ul>
        </div>
        <div className="employees-hero__actions">
          <Button variant="secondary" onClick={() => window.alert('Exportação disponível em breve.')}>Exportar CSV</Button>
          <Button variant="primary" onClick={handleScrollToForm}>Adicionar funcionário</Button>
        </div>
      </header>

      <section className="employees-summary" aria-label="Resumo do período">
        <article className="summary-card">
          <span className="summary-card__label">Headcount ativo</span>
          <strong className="summary-card__value">{summaryMetrics.ativos}</strong>
          <span className="summary-card__meta">Total: {summaryMetrics.headcount}</span>
        </article>
        <article className="summary-card">
          <span className="summary-card__label">Folha estimada</span>
          <strong className="summary-card__value">{formatCurrency(summaryMetrics.folha)}</strong>
          <span className="summary-card__meta">Média por colaborador: {formatCurrency(summaryMetrics.mediaFolha)}</span>
        </article>
        <article className="summary-card">
          <span className="summary-card__label">Encargos</span>
          <strong className="summary-card__value">{formatCurrency(summaryMetrics.encargos)}</strong>
          <span className="summary-card__meta">Média: {formatCurrency(summaryMetrics.mediaEncargos)}</span>
        </article>
        <article className="summary-card">
          <span className="summary-card__label">Provisões</span>
          <strong className="summary-card__value">{formatCurrency(summaryMetrics.provisoes)}</strong>
          <span className="summary-card__meta">Média: {formatCurrency(summaryMetrics.mediaProvisoes)}</span>
        </article>
      </section>

      <section className="employees-toolbar" aria-label="Filtros e pesquisa">
        <div className="toolbar-field">
          <label htmlFor="searchEmployee">Buscar funcionário</label>
          <input
            id="searchEmployee"
            type="search"
            placeholder="Busque por nome ou cargo"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="toolbar-field">
          <label htmlFor="filterSetor">Setor</label>
          <select id="filterSetor" disabled>
            <option>Todos</option>
          </select>
        </div>
        <div className="toolbar-field">
          <label htmlFor="filterPeriodo">Período</label>
          <select id="filterPeriodo" disabled>
            <option>Últimos 12 meses</option>
          </select>
        </div>
        <p className="toolbar-note">Filtros por setor e período chegam em breve.</p>
      </section>

      <section className="employees-panel" aria-label="Visão consolidada">
        <Card className="employees-panel__chart">
          <header className="employees-panel__heading">
            <div>
              <h2>Distribuição das verbas</h2>
              <p>Visualize como salários e encargos impactam o período selecionado.</p>
            </div>
          </header>
          <EncargosPie data={globalPieData} variant="total" />
        </Card>
        <Card className="employees-form-card">
          <div ref={formRef} className="employees-form-card__inner">
            <header className="employees-panel__heading">
              <div>
                <h2>Cadastrar funcionário</h2>
                <p>Informe dados contratuais e ajustaremos os encargos automaticamente.</p>
              </div>
            </header>
            <form onSubmit={handleSubmit} className="employees-form" noValidate>
              <Input label="Nome" name="nome" value={formData.nome} onChange={handleInputChange} required />
              <Input label="Cargo" name="cargo" value={formData.cargo} onChange={handleInputChange} required />
              <Input label="Salário base (R$)" name="salarioBase" type="number" step="0.01" min="0" value={formData.salarioBase} onChange={handleInputChange} required />
            <DateField label="Data de entrada" name="dataEntrada" value={formData.dataEntrada} onChange={handleInputChange} required error={dateErrors.entrada} />
            <DateField label="Data de saída" name="dataSaida" value={formData.dataSaida} onChange={handleInputChange} error={dateErrors.saida} />
            <Select label="Setor" name="setor" value={formData.setor} onChange={handleInputChange} required>
              <option value="comercio">Comércio</option>
              <option value="industria">Indústria</option>
              <option value="servicos">Serviços</option>
            </Select>
            <Input label={labelCpfCnpj(formData.cpfCnpj)} name="cpfCnpj" value={formData.cpfCnpj} onChange={handleInputChange} placeholder="Apenas números" error={errors.cpfCnpj} />
              <div className="employees-form__footer">
                <div className="badge">Entrada: {fmtDMY(formData.dataEntrada) || '--'}</div>
                <div className="badge">Cálculo até: {fmtDMY(formData.dataSaida) || '--'}</div>
                <Button type="submit" variant="primary">Salvar colaborador</Button>
              </div>
            </form>
            <div className="employees-policy" role="group" aria-label="Configuração de cálculo">
              <Select label="Provisionar mês parcial" name="provisionarMesParcial" value={calcConfig.provisionarMesParcial ? 'true' : 'false'} onChange={handleConfigChange}>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </Select>
              <Select label="Base de dias" name="baseDias" value={calcConfig.baseDias} onChange={handleConfigChange}>
                <option value="calendario">Calendário</option>
                <option value="comercial30">Comercial (30 dias)</option>
              </Select>
              <Select label="Metodologia férias" name="feriasMetodologia" value={calcConfig.feriasMetodologia} onChange={handleConfigChange}>
                <option value="mensal">Mensal (1/12)</option>
                <option value="diaria">Diária</option>
              </Select>
            </div>
          </div>
        </Card>
      </section>

      <section className="employees-list" aria-label="Funcionários">
        {filteredFuncionarios.map((funcionario) => {
          const resumo = funcionario.relatorioMensal || []
          const totaisFinanceiros = funcionario.financeiroTotais || { salario: 0, encargos: 0, provisoes: 0, periodo: resumo.reduce((acc, r) => acc + (r.totalMes || 0), 0) }
          const pieData = [
            { name: 'INSS', value: resumo.reduce((acc, r) => acc + (r.encargos?.inss || 0), 0) },
            { name: 'FGTS', value: resumo.reduce((acc, r) => acc + (r.encargos?.fgts || 0), 0) },
            { name: 'Terceiros', value: resumo.reduce((acc, r) => acc + (r.encargos?.terceiros || 0), 0) },
            { name: 'RAT', value: resumo.reduce((acc, r) => acc + (r.encargos?.rat || 0), 0) },
          ]
          const totalPeriodo = totaisFinanceiros.periodo
          return (
            <Card key={funcionario.id} className="employee-card">
              <header className="employee-card__header">
                <div className="employee-card__title">
                  <h3>{funcionario.nome}</h3>
                  <span>{funcionario.cargo}</span>
                </div>
                <div className="employee-card__meta">
                  <span>{labelCpfCnpj(funcionario.cpfCnpj)}: {formatCpfCnpj(funcionario.cpfCnpj)}</span>
                  <span>Setor: {funcionario.setor}</span>
                  <span>Salário base: {formatCurrency(funcionario.salarioBase)}</span>
                  <span>Período: {fmtDMY(funcionario.dataEntrada)} — {fmtDMY(funcionario.dataSaida) || 'ATIVO'}</span>
                </div>
              </header>
              <div className="employee-card__body">
                <div className="employee-card__summary">
                  <div>
                    <span className="summary-card__label">Encargos + provisões</span>
                    <strong className="summary-card__value">{formatCurrency(totalPeriodo)}</strong>
                    <p className="summary-card__meta">Encargos: {formatCurrency(totaisFinanceiros.encargos)} · Provisões: {formatCurrency(totaisFinanceiros.provisoes)}</p>
                  </div>
                  <EncargosPie data={pieData} />
                </div>
                <div className="employee-card__months">
                  {resumo.map((relatorio, index) => (
                    <div key={index} className="employee-month">
                      <div className="employee-month__heading">
                        <h4>{relatorio.label || relatorio.mes}</h4>
                        <span>{relatorio.diasTrabalhados} dias · Salário: {formatCurrency(relatorio.salarioCompetencia || 0)}</span>
                      </div>
                      <div className="employee-month__grid">
                        <div>
                          <h5>Encargos</h5>
                          <ul>
                            <li>INSS Patronal: {formatCurrency(relatorio.encargos.inss)}</li>
                            <li>FGTS: {formatCurrency(relatorio.encargos.fgts)}</li>
                            <li>Terceiros: {formatCurrency(relatorio.encargos.terceiros)}</li>
                            <li>RAT: {formatCurrency(relatorio.encargos.rat)}</li>
                            <li className="employee-month__total">Total: {formatCurrency(relatorio.encargos.total)}</li>
                          </ul>
                        </div>
                        <div>
                          <h5>Provisões</h5>
                          <ul>
                            <li>13º Salário: {formatCurrency(relatorio.provisoes.decimoTerceiro)}</li>
                            <li>Férias: {formatCurrency(relatorio.provisoes.ferias)}</li>
                            <li>1/3 Férias: {formatCurrency(relatorio.provisoes.tercoFerias)}</li>
                            <li>FGTS sobre provisões: {formatCurrency(relatorio.provisoes.fgtsProvisoes)}</li>
                            {typeof relatorio.encargosProvisoes === 'number' ? (
                              <li>Encargos sobre provisões: {formatCurrency(relatorio.encargosProvisoes)}</li>
                            ) : null}
                            {relatorio.multaFgts32 ? (
                              <li>Multa FGTS provisionada (3,2%): {formatCurrency(relatorio.multaFgts32)}</li>
                            ) : null}
                            <li className="employee-month__total">Total: {formatCurrency(relatorio.provisoes.total)}</li>
                          </ul>
                        </div>
                      </div>
                      <footer>Verba mensal total: {formatCurrency(relatorio.totalMes)}</footer>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )
        })}

        {filteredFuncionarios.length === 0 && (
          <Card className="employees-empty">
            <h3>Nenhum funcionário encontrado</h3>
            <p>Ajuste os filtros ou cadastre um novo colaborador para começar a visualizar os encargos.</p>
            <Button variant="primary" onClick={handleScrollToForm}>Cadastrar primeiro funcionário</Button>
          </Card>
        )}
      </section>
    </div>
  )
}

function fmtDMY(value) {
  if (!value) return ''
  const d = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseYMD(value) : value
  if (!d || isNaN(d)) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}
function fmtYMD(d) {
  if (!d) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatCurrency(value) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
  } catch {
    return `R$ ${(Number(value || 0)).toFixed(2)}`
  }
}
