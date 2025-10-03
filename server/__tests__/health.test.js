import request from 'supertest'
import app from '../index.js'
import { describe, it, expect } from 'vitest'

describe('GET /api/health', () => {
  it('responds with ok true', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
  })
})
