export default function DateField({ label, hint, error, id, ...props }) {
  const dateId = id || props.name
  const hintId = hint ? `${dateId}-hint` : undefined
  const errId = error ? `${dateId}-error` : undefined
  return (
    <div className="field">
      {label && <label htmlFor={dateId}>{label}</label>}
      <input type="date" id={dateId} className="datefield" aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined} aria-invalid={!!error || undefined} {...props} />
      {hint && <div id={hintId} className="hint">{hint}</div>}
      {error && <div id={errId} className="error">{error}</div>}
    </div>
  )
}

