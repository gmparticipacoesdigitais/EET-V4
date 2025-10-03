import supabase from '../lib/supabase'

const LS_KEY = (uid) => `employees:${uid}`

export function subscribeEmployees(uid, onChange) {
  if (!uid) return () => {}
  const loadLocal = () => {
    try {
      const raw = localStorage.getItem(LS_KEY(uid))
      const list = raw ? JSON.parse(raw) : []
      onChange(list)
    } catch {
      onChange([])
    }
  }
  if (uid === 'dev' || !supabase) { loadLocal(); return () => {} }
  supabase
    .from('employees')
    .select('id,data,updated_at')
    .eq('user_id', uid)
    .order('updated_at', { ascending: false })
    .then(({ data, error }) => {
      if (error) return loadLocal()
      const list = (data || []).map((r) => r.data || r)
      onChange(list)
      try { localStorage.setItem(LS_KEY(uid), JSON.stringify(list)) } catch {}
    })
  return () => {}
}

export async function upsertEmployee(uid, emp) {
  try {
    const raw = localStorage.getItem(LS_KEY(uid))
    const list = raw ? JSON.parse(raw) : []
    const idx = list.findIndex((e) => e.id === emp.id)
    const now = Date.now()
    const toSave = { ...emp, updatedAt: now, createdAt: emp.createdAt || now }
    if (idx >= 0) list[idx] = toSave; else list.unshift(toSave)
    localStorage.setItem(LS_KEY(uid), JSON.stringify(list))
  } catch {}
  if (uid === 'dev' || !supabase) return
  try {
    await supabase.from('employees').upsert({ id: String(emp.id), user_id: uid, data: emp, updated_at: new Date().toISOString() })
  } catch {}
}

export async function removeEmployee(uid, id) {
  try {
    const raw = localStorage.getItem(LS_KEY(uid))
    const list = raw ? JSON.parse(raw) : []
    const next = list.filter((e) => e.id !== id)
    localStorage.setItem(LS_KEY(uid), JSON.stringify(next))
  } catch {}
  if (uid === 'dev' || !supabase) return
  try {
    await supabase.from('employees').delete().eq('user_id', uid).eq('id', String(id))
  } catch {}
}
