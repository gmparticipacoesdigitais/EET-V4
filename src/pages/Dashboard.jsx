import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import Card from '../components/Card'
import EncargosPie from '../components/EncargosPie'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DashboardPage() {
  const { funcionarios } = useOutletContext()

  const kpis = useMemo(() => {
    const totals = { inss: 0, fgts: 0, terceiros: 0, rat: 0, prov: 0 }
    for (const f of funcionarios) {
      for (const r of f.relatorioMensal || []) {
        totals.inss += r.encargos.inss
        totals.fgts += r.encargos.fgts
        totals.terceiros += r.encargos.terceiros
        totals.rat += r.encargos.rat
        totals.prov += r.provisoes.decimoTerceiro + r.provisoes.ferias + r.provisoes.tercoFerias + r.provisoes.fgtsProvisoes
      }
    }
    const total = totals.inss + totals.fgts + totals.terceiros + totals.rat + totals.prov
    return { ...totals, total }
  }, [funcionarios])

  const pieData = useMemo(() => ([
    { name: 'INSS', value: kpis.inss },
    { name: 'FGTS', value: kpis.fgts },
    { name: 'Terceiros', value: kpis.terceiros },
    { name: 'RAT', value: kpis.rat },
  ]), [kpis])

  const bars = useMemo(() => (funcionarios.map((f) => ({
    name: f.nome,
    total: (f.relatorioMensal || []).reduce((acc, r) => acc + r.totalMes, 0)
  }))), [funcionarios])

  const formatCurrency = (n) => {
    try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0) } catch { return `R$ ${(n||0).toFixed(2)}` }
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="kpi-grid">
        <Card><div className="kpi"><div className="label">Total</div><div className="value">{formatCurrency(kpis.total)}</div></div></Card>
        <Card><div className="kpi"><div className="label">INSS</div><div className="value">{formatCurrency(kpis.inss)}</div></div></Card>
        <Card><div className="kpi"><div className="label">FGTS</div><div className="value">{formatCurrency(kpis.fgts)}</div></div></Card>
        <Card><div className="kpi"><div className="label">Terceiros</div><div className="value">{formatCurrency(kpis.terceiros)}</div></div></Card>
        <Card><div className="kpi"><div className="label">RAT</div><div className="value">{formatCurrency(kpis.rat)}</div></div></Card>
        <Card><div className="kpi"><div className="label">Provisões</div><div className="value">{formatCurrency(kpis.prov)}</div></div></Card>
      </div>

      <div className="grid-main">
        <EncargosPie data={pieData} />
        <Card className="chart-card">
          <div className="chart-area">
            <ResponsiveContainer>
              <BarChart data={bars}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-ink-soft)' }} />
                <YAxis tick={{ fill: 'var(--color-ink-soft)' }} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                <Bar dataKey="total" fill="var(--accent-500)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
