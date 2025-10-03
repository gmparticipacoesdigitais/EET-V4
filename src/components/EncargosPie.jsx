import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const COLORS = [
  '#22d3ee', // cyan-400
  '#e879f9', // fuchsia-400
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#f472b6', // pink-400
  '#fbbf24', // amber-400
  '#a78bfa', // violet-400
  '#fb7185', // rose-400
]

function currencyBRL(v) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  } catch {
    return `R$ ${(v || 0).toFixed(2)}`
  }
}

export default function EncargosPie({ data, height = 220, variant }) {
  const safeData = Array.isArray(data) ? data.filter(d => d && d.value > 0) : []
  const total = safeData.reduce((acc, d) => acc + d.value, 0)

  if (!safeData.length || total <= 0) {
    return (
      <div className="card" style={{ minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-soft)' }}>
        Sem dados suficientes para o gráfico
      </div>
    )
  }

  const cardClass = variant === 'total' ? 'card chart-card chart-card--total' : 'card chart-card'
  const areaClass = variant === 'total' ? 'chart-area chart-area--tall' : 'chart-area'
  return (
    <div className={cardClass}>
      <div className={areaClass} style={variant === 'total' ? undefined : { height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={safeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {safeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => currencyBRL(value)}
              contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-ink)' }}
            />
            <Legend
              verticalAlign="bottom"
              height={24}
              wrapperStyle={{ color: '#cbd5e1' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
