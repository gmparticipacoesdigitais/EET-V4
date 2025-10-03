import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:8080'
const OUTDIR = path.resolve('screenshots')

async function ensureOutdir() {
  await fs.promises.mkdir(OUTDIR, { recursive: true })
}

async function captureAuth(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('.auth-card', { timeout: 15000 })
  await page.screenshot({ path: path.join(OUTDIR, 'auth.png'), fullPage: true })
  await ctx.close()
}

async function addEmployee(page, f) {
  await page.goto(`${BASE}/funcionarios`)
  await page.waitForSelector('#nome', { timeout: 15000 })
  await page.fill('#nome', f.nome)
  await page.fill('#cargo', f.cargo)
  await page.fill('#salarioBase', String(f.salarioBase))
  await page.fill('#dataEntrada', f.dataEntrada)
  if (f.dataSaida) await page.fill('#dataSaida', f.dataSaida)
  if (f.setor) await page.selectOption('#setor', f.setor)
  if (f.cpfCnpj) await page.fill('#cpfCnpj', f.cpfCnpj)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(300)
}

async function captureApp(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => { try { localStorage.setItem('bypassAuth', '1') } catch {} })
  const page = await ctx.newPage()

  // Seed 2 funcionários to populate dashboard/charts
  await addEmployee(page, { nome: 'Maria Souza', cargo: 'Analista', salarioBase: 4500, dataEntrada: '2024-01-10', setor: 'comercio' })
  await addEmployee(page, { nome: 'João Lima', cargo: 'Coordenador', salarioBase: 6200, dataEntrada: '2023-11-05', setor: 'servicos' })

  // Funcionários screenshot (after adding)
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUTDIR, 'funcionarios.png'), fullPage: true })

  // Dashboard screenshot
  await page.goto(`${BASE}/dashboard`)
  await page.waitForSelector('.recharts-surface', { timeout: 15000 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(OUTDIR, 'dashboard.png'), fullPage: true })

  // Relatórios screenshot
  await page.goto(`${BASE}/relatorios`)
  await page.waitForSelector('table', { timeout: 15000 })
  await page.screenshot({ path: path.join(OUTDIR, 'relatorios.png'), fullPage: true })

  await ctx.close()
}

async function main() {
  await ensureOutdir()
  const browser = await chromium.launch()
  try {
    await captureAuth(browser)
    await captureApp(browser)
  } finally {
    await browser.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })

