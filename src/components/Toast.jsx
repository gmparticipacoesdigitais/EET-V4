import { useEffect, useState } from 'react'

let globalPush
export function useToast() {
  // Hook to expose push function to components
  const push = (t) => globalPush?.(t)
  return { push }
}

// Allow pushing toasts from non-React modules
export function pushToast(t) {
  try { globalPush?.(t) } catch {}
}

export default function ToastStack() {
  const [items, setItems] = useState([])

  useEffect(() => {
    globalPush = (t) => {
      const id = Math.random().toString(36).slice(2)
      const it = { id, type: t.type || 'info', text: t.text || '', timeout: t.timeout || 3000 }
      setItems((prev) => [...prev, it])
      if (it.timeout) setTimeout(() => dismiss(id), it.timeout)
    }
    const onGlobal = (e) => {
      try { const d = e.detail || {}; globalPush?.(d) } catch {}
    }
    window.addEventListener('app:toast', onGlobal)
    return () => { globalPush = undefined }
  }, [])

  const dismiss = (id) => setItems((prev) => prev.filter((i) => i.id !== id))

  return (
    <div className="toast-stack" role="region" aria-live="polite" aria-label="Notificações">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} role="status">
          <span>{t.text}</span>
          <button className="btn btn-ghost" onClick={() => dismiss(t.id)} aria-label="Fechar">✕</button>
        </div>
      ))}
    </div>
  )
}
