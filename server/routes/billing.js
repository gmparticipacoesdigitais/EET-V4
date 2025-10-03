import { Router } from 'express'
import { supabaseAdmin } from '../supabaseAdmin.js'
import { verifyIdToken } from '../middleware/auth.js'

// Helpers shared by routes
export function createBillingHelpers({ stripe }) {
  if (!stripe) throw new Error('Stripe client is required')

  const getOrCreateStripeCustomerId = async ({ uid, email }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    // 1. Find the user's profile and their Stripe customer ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', uid)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to get user profile: ${profileError.message}`);
    }

    if (profile?.stripe_customer_id) {
      return profile.stripe_customer_id;
    }

    // 2. If no customer ID, create a new Stripe customer
    const customer = await stripe.customers.create({ 
      email: email || undefined, 
      metadata: { uid } 
    });
    const newCustomerId = customer.id;

    // 3. Update the user's profile with the new customer ID
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: newCustomerId })
      .eq('id', uid);

    if (updateError) {
      throw new Error(`Failed to update user profile with Stripe ID: ${updateError.message}`);
    }

    // 4. Create a reverse mapping for webhooks
    const { error: mappingError } = await supabaseAdmin
      .from('stripe_customers')
      .insert({ user_id: uid, customer_id: newCustomerId });

    if (mappingError) {
        throw new Error(`Failed to create Stripe customer mapping: ${mappingError.message}`);
    }

    return newCustomerId;
  }

  const getSubscriptionStatus = async ({ customerId }) => {
    const targetPrice = process.env.STRIPE_PRICE_ID || null
    const targetProduct = process.env.STRIPE_PRODUCT_ID || null
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', expand: ['data.items'] })
    let active = false
    let status = 'none'

    if (!targetPrice && !targetProduct) {
      for (const s of subs.data) {
        if (s.status === 'active' || s.status === 'trialing') { active = true; status = s.status; break }
      }
      return { active, status }
    }

    for (const s of subs.data) {
      const items = s.items?.data || []
      const matches = items.some((it) => {
        const price = it.price
        if (!price) return false
        if (targetPrice && price.id === targetPrice) return true
        if (targetProduct && (price.product === targetProduct || price.product?.id === targetProduct)) return true
        return false
      })
      if (!matches) continue
      status = s.status
      if (status === 'active' || status === 'trialing') { active = true; break }
    }
    return { active, status }
  }

  return { getOrCreateStripeCustomerId, getSubscriptionStatus }
}

export function createBillingRouter({ stripe, appUrl }) {
  const router = Router()
  const { getOrCreateStripeCustomerId, getSubscriptionStatus } = createBillingHelpers({ stripe })

  // All routes gated by Supabase auth
  router.use(verifyIdToken)

  // POST /api/stripe/checkout -> create Checkout Session (subscription)
  router.post('/stripe/checkout', async (req, res) => {
    try {
      if (!stripe) return res.status(503).json({ error: 'Stripe not configured' })
      const { uid, email } = req.auth
      const stripeCustomerId = await getOrCreateStripeCustomerId({ uid, email })

      const sub = await getSubscriptionStatus({ customerId: stripeCustomerId })
      if (sub.active) return res.status(400).json({ error: 'Subscription already active' })

      const price = process.env.STRIPE_PRICE_ID
      if (!price) return res.status(500).json({ error: 'STRIPE_PRICE_ID not configured' })
      const successBase = process.env.APP_URL || process.env.PUBLIC_BASE_URL || appUrl || ''
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [{ price, quantity: 1 }],
        success_url: `${successBase}/dashboard`,
        cancel_url: `${successBase}/subscribe`,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      })
      return res.json({ url: session.url })
    } catch (e) {
      return res.status(500).json({ error: e.message || 'Failed to create checkout session' })
    }
  })

  // POST /api/stripe/portal -> create Billing Portal session
  router.post('/stripe/portal', async (req, res) => {
    try {
      if (!stripe) return res.status(503).json({ error: 'Stripe not configured' })
      const { uid, email } = req.auth
      const stripeCustomerId = await getOrCreateStripeCustomerId({ uid, email })
      const returnUrl = process.env.APP_URL || process.env.PUBLIC_BASE_URL || appUrl || '/'
      const sess = await stripe.billingPortal.sessions.create({ customer: stripeCustomerId, return_url: `${returnUrl}/dashboard` })
      return res.json({ url: sess.url })
    } catch (e) {
      return res.status(500).json({ error: e.message || 'Failed to create portal session' })
    }
  })

  // GET /api/bootstrap -> returns auth + subscription status
  router.get('/bootstrap', async (req, res) => {
    try {
      const { uid, email } = req.auth
      const stripeCustomerId = await getOrCreateStripeCustomerId({ uid, email })
      const subscription = await getSubscriptionStatus({ customerId: stripeCustomerId })
      return res.json({
        auth: { uid, email },
        subscription,
      })
    } catch (e) {
      return res.status(500).json({ error: e.message || 'Bootstrap failed' })
    }
  })

  return router
}
