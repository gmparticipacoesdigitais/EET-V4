import { useLocation } from 'react-router-dom'

const titles = {
  '/': { title: 'Dashboard', subtitle: 'Resumo de encargos, provisões e evolução' },
  '/dashboard': { title: 'Dashboard', subtitle: 'Resumo de encargos, provisões e evolução' },
  '/funcionarios': { title: 'Funcionários', subtitle: 'Gerencie colaboradores e cálculos' },
  '/relatorios': { title: 'Relatórios', subtitle: 'Exportações e filtros por período' },
}

export default function Hero() {
  const { pathname } = useLocation()
  const match = Object.keys(titles).find((k) => pathname === k) || '/'
  const { title, subtitle } = titles[match]
  return (
    <section className="hero hero-light-lavender">
      <div className="container">
        <div className="copy">
          <h1 className="heading-1">{title}</h1>
          <p className="text-soft">{subtitle}</p>
        </div>
      </div>
    </section>
  )
}
