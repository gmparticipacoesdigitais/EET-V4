export function onlyDigits(v = '') {
  return String(v).replace(/\D+/g, '')
}

export function isValidCPF(value) {
  const cpf = onlyDigits(value)
  if (!cpf || cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false // all same digits

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i)
  let d1 = (sum * 10) % 11
  if (d1 === 10) d1 = 0
  if (d1 !== parseInt(cpf[9], 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i)
  let d2 = (sum * 10) % 11
  if (d2 === 10) d2 = 0
  return d2 === parseInt(cpf[10], 10)
}

export function isValidCNPJ(value) {
  const cnpj = onlyDigits(value)
  if (!cnpj || cnpj.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cnpj)) return false // all same digits

  const calcDigit = (base) => {
    const weights = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const nums = base.split('').map(n => parseInt(n, 10))
    const sum = nums.reduce((acc, n, i) => acc + n * weights[i], 0)
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }

  const d1 = calcDigit(cnpj.slice(0, 12))
  const d2 = calcDigit(cnpj.slice(0, 12) + String(d1))
  return d1 === parseInt(cnpj[12], 10) && d2 === parseInt(cnpj[13], 10)
}

export function labelCpfCnpj(v) {
  const d = onlyDigits(v)
  return d.length > 11 ? 'CNPJ' : 'CPF'
}

export function formatCpf(value = '') {
  const d = onlyDigits(value).slice(0, 11)
  const parts = []
  if (d.length > 3) parts.push(d.slice(0, 3))
  if (d.length > 6) parts.push(d.slice(3, 6))
  if (d.length > 9) parts.push(d.slice(6, 9))
  const rest = d.length > 9 ? d.slice(9, 11) : d.slice(parts.join('').length)
  return [parts[0] || d, parts[1], parts[2]].filter(Boolean).join('.') + (rest ? '-' + rest : (parts.length ? '' : ''))
}

export function formatCnpj(value = '') {
  const d = onlyDigits(value).slice(0, 14)
  const p1 = d.slice(0, 2)
  const p2 = d.slice(2, 5)
  const p3 = d.slice(5, 8)
  const p4 = d.slice(8, 12)
  const p5 = d.slice(12, 14)
  let out = p1
  if (p2) out += '.' + p2
  if (p3) out += '.' + p3
  if (p4) out += '/' + p4
  if (p5) out += '-' + p5
  return out
}

export function formatCpfCnpj(value = '') {
  const d = onlyDigits(value)
  if (d.length <= 11) return formatCpf(d)
  return formatCnpj(d)
}
