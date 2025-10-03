import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) => ({
  'aria-current': isActive ? 'page' : undefined,
})

export default function Sidebar() {
  return (
    <nav aria-label="Navegação">
      <NavLink to="/dashboard" {...linkClass}>Dashboard</NavLink>
      <NavLink to="/funcionarios" {...linkClass}>Funcionários</NavLink>
      <NavLink to="/relatorios" {...linkClass}>Relatórios</NavLink>
      <a href="#" aria-disabled="true" style={{ opacity: .5 }}>Configurações</a>
    </nav>
  )
}

