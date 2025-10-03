import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pino from 'pino'
import net from 'node:net'

const app = express()
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

// Desired port (used for initial fallback and messaging)
const DESIRED_PORT = process.env.PORT ? Number(process.env.PORT) : 8080
// Public app URL (frontend). Do NOT use Vite client env here; prefer explicit app/front URLs.
let PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || process.env.APP_URL || process.env.FRONTEND_URL || `http://localhost:${DESIRED_PORT}`

// CORS: allow configured origins and credentials
const ALLOW_ORIGINS = (process.env.CORS_ALLOW_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
if (ALLOW_ORIGINS.length > 0) {
  app.use(cors({ origin: (origin, cb) => {
    // Allow same-origin or listed origins
    if (!origin) return cb(null, true)
    if (ALLOW_ORIGINS.includes(origin)) return cb(null, true)
    return cb(new Error('CORS not allowed'), false)
  }, credentials: true }))
} else {
  // Default permissive in dev, but reflect origin (not *) to support credentials when needed
  app.use(cors({ origin: true, credentials: true }))
}
// JSON for regular routes
app.use('/api', express.json())

// Public health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

// APP ROUTERS
import { adminRouter } from './routes/admin.js';
import { calculationsRouter } from './routes/calculations.js';
import { employeesRouter } from './routes/employees.js';
import { createBillingRouter } from './routes/billing.js';

app.use('/api/admin', adminRouter);
app.use('/api/calculations', calculationsRouter);
app.use('/api/employees', employeesRouter);

// Stripe Billing
import Stripe from 'stripe'
if (process.env.STRIPE_SECRET_KEY) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const billingRouter = createBillingRouter({ stripe, appUrl: PUBLIC_BASE_URL })
  app.use('/api/billing', billingRouter) // Changed from /api to /api/billing
  logger.info('Stripe billing routes enabled.')
} else {
  logger.warn('STRIPE_SECRET_KEY not found, Stripe billing routes disabled.')
}



let serverInstance = null
// Start server unless in test mode, but allow override for e2e tests
if (process.env.NODE_ENV !== 'test' || process.env.RUN_SERVER_IN_TEST === 'true') {
  // Port selection helpers (ESM + top-level await)
  function isPortFree(port, host = '0.0.0.0') {
    return new Promise((resolve) => {
      const srv = net
        .createServer()
        .once('error', (err) => {
          // Consider occupied if EADDRINUSE or EACCES
          if (err.code === 'EADDRINUSE' || err.code === 'EACCES') resolve(false)
          else resolve(false)
        })
        .once('listening', () => {
          srv.close(() => resolve(true))
        })
      srv.listen({ port, host })
    })
  }

  async function pickPort(desired = 8080) {
    const candidates = [
      Number(process.env.PORT) || desired,
      3000,
      3001,
      5000,
      5173,
      0, // let the OS choose
    ]

    for (const p of candidates) {
      if (p === 0 || (await isPortFree(p))) return p
    }
    return 0
  }

  const port = await pickPort(DESIRED_PORT)

  serverInstance = app.listen(port, () => {
    const actual = serverInstance.address().port

    // Update PUBLIC_BASE_URL fallback with the actual chosen port
    if (!process.env.VITE_PUBLIC_BASE_URL && !process.env.PUBLIC_BASE_URL) {
      PUBLIC_BASE_URL = `http://localhost:${actual}`
    }

    if (actual !== (Number(process.env.PORT) || DESIRED_PORT)) {
      // eslint-disable-next-line no-console
      console.log(`[server] Porta desejada ocupada. Servidor subiu automaticamente em ${actual}.`)
    } else {
      // eslint-disable-next-line no-console
      console.log(`[server] Servidor ouvindo em ${actual}.`)
    }
    // eslint-disable-next-line no-console
    console.log(`API listening on ${actual}. Public URL: ${PUBLIC_BASE_URL}`)
  })

  // Optional: handle other unexpected listen errors
  serverInstance.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[server] Erro ao iniciar:', err)
    process.exitCode = 1
  })
}

export const server = serverInstance
export default app
