export default function Select({ label, hint, error, id, children, ...props }) {
  const selectId = id || props.name
  const hintId = hint ? `${selectId}-hint` : undefined
  const errId = error ? `${selectId}-error` : undefined
  return (
    <div className="field">
      {label && <label htmlFor={selectId}>{label}</label>}
      <select id={selectId} className="select" aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined} aria-invalid={!!error || undefined} {...props}>
        {children}
      </select>
      {hint && <div id={hintId} className="hint">{hint}</div>}
      {error && <div id={errId} className="error">{error}</div>}
    </div>
  )
}

