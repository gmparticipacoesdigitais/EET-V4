export default function Table({ columns = [], rows = [], renderActions }) {
  return (
    <div className="card" role="region" aria-label="Tabela de funcionários">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col">{c.header}</th>
              ))}
              {renderActions && <th scope="col">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id || idx}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>
                ))}
                {renderActions && <td className="actions">{renderActions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
