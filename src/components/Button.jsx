export default function Button({ variant = 'primary', children, className = '', ...props }) {
  const base = 'btn'
  const style = `btn-${variant}`
  return (
    <button className={`${base} ${style} ${className}`} {...props}>
      {children}
    </button>
  )
}

