import 'dotenv/config'; // Load environment variables
import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import app from '../index.js'; // Corrected path to the express app

const request = supertest(app);

describe('Billing API Integration Tests', () => {

  describe('POST /api/billing/stripe/checkout', () => {

    it('should return 401 Unauthorized if no auth token is provided', async () => {
      const response = await request
        .post('/api/billing/stripe/checkout')
        .send();

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('AUTH_REQUIRED');
    });

    it('should return 401 Unauthorized if an invalid or expired token is provided', async () => {
      const response = await request
        .post('/api/billing/stripe/checkout')
        .set('Authorization', 'Bearer invalid-token')
        .send();

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('AUTH_INVALID');
    });

    // --- Test for successful checkout session creation ---
    // This test is structured but requires a valid Supabase JWT to run.
    // To run this test, you need to:
    // 1. Log in to your application as a test user.
    // 2. Get the access token from the user's session (e.g., from browser dev tools).
    // 3. Paste the token into the placeholder below.
    it.skip('should return a Stripe checkout URL for an authenticated user', async () => {
      const SUPABASE_ACCESS_TOKEN = 'PASTE_A_VALID_JWT_HERE';

      if (SUPABASE_ACCESS_TOKEN === 'PASTE_A_VALID_JWT_HERE') {
        console.warn('Skipping authenticated checkout test: No JWT provided.');
        return;
      }

      const response = await request
        .post('/api/billing/stripe/checkout')
        .set('Authorization', `Bearer ${SUPABASE_ACCESS_TOKEN}`)
        .send();

      // Expect a successful response (e.g., 200, or 303/302 for redirect)
      expect(response.status).toBe(200);
      
      // Expect the response to be JSON with a URL property
      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toContain('https://checkout.stripe.com/');
    });

  });

});
