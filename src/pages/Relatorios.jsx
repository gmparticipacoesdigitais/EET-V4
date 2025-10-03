import Card from '../components/Card'
import Button from '../components/Button'
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

function toCSV(rows) {
  const headers = Object.keys(rows[0] || { nome: '', cargo: '', total: 0 })
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))
  }
  return lines.join('\n')
}

export default function RelatoriosPage() {
  const { funcionarios } = useOutletContext()
  const [period, setPeriod] = useState('all')

  const rows = useMemo(() => funcionarios.map((f) => ({
    nome: f.nome,
    cargo: f.cargo,
    total: (f.relatorioMensal || []).reduce((acc, r) => acc + r.totalMes, 0)
  })), [funcionarios])

  const download = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    if (!rows.length) return
    download(toCSV(rows), 'relatorio.csv', 'text/csv;charset=utf-8;')
  }
  const exportJSON = () => download(JSON.stringify(rows, null, 2), 'relatorio.json', 'application/json')

  return (
    <div className="grid" style={{ gap: 16 }}>
      <Card>
        <div className="flex items-center" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>Relatórios</h2>
            <p style={{ color: 'var(--color-ink-soft)' }}>Exporte os dados em CSV ou JSON</p>
          </div>
          <div className="flex items-center" style={{ gap: 8 }}>
            <Button onClick={exportCSV}>Exportar CSV</Button>
            <Button variant="secondary" onClick={exportJSON}>Exportar JSON</Button>
          </div>
        </div>
      </Card>
      <Card>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Total (R$)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.nome}</td>
                <td>{r.cargo}</td>
                <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.total)}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-ink-soft)' }}>Sem dados</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

