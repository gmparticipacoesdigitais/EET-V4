import { describe, it, expect } from 'vitest'
import { onlyDigits, isValidCPF, isValidCNPJ, formatCpf, formatCnpj, formatCpfCnpj } from './br'

describe('BR utils', () => {
  it('onlyDigits removes non-numeric', () => {
    expect(onlyDigits('a1b2c3')).toBe('123')
    expect(onlyDigits('529.982.247-25')).toBe('52998224725')
  })

  it('validates CPF correctly', () => {
    expect(isValidCPF('52998224725')).toBe(true)
    expect(isValidCPF('11111111111')).toBe(false)
    expect(isValidCPF('529.982.247-25')).toBe(true)
    expect(isValidCPF('52998224724')).toBe(false)
  })

  it('validates CNPJ correctly', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true)
    expect(isValidCNPJ('11222333000181')).toBe(true)
    expect(isValidCNPJ('11222333000180')).toBe(false)
    expect(isValidCNPJ('00.000.000/0000-00')).toBe(false)
  })

  it('formats CPF/CNPJ', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25')
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatCpfCnpj('52998224725')).toBe('529.982.247-25')
    expect(formatCpfCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })
})

