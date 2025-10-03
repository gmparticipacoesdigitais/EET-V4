export default function Input({ label, hint, error, id, ...props }) {
  const inputId = id || props.name
  const hintId = hint ? `${inputId}-hint` : undefined
  const errId = error ? `${inputId}-error` : undefined
  return (
    <div className="field">
      {label && <label htmlFor={inputId}>{label}</label>}
      <input id={inputId} className="input" aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined} aria-invalid={!!error || undefined} {...props} />
      {hint && <div id={hintId} className="hint">{hint}</div>}
      {error && <div id={errId} className="error">{error}</div>}
    </div>
  )
}

