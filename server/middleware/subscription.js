import Stripe from 'stripe';
import { createBillingHelpers } from '../routes/billing.js';

// This middleware checks if the authenticated user has an active Stripe subscription.
export async function requireActiveSubscription(req, res, next) {
  try {
    const uid = req.auth?.uid;
    const email = req.auth?.email;

    if (!uid) {
      return res.status(401).json({ code: 'AUTH_REQUIRED', error: 'Missing user' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        console.warn('Stripe is not configured. Subscription check will be skipped.');
        return next();
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { getOrCreateStripeCustomerId, getSubscriptionStatus } = createBillingHelpers({ stripe });

    const stripeCustomerId = await getOrCreateStripeCustomerId({ uid, email });
    const subscription = await getSubscriptionStatus({ customerId: stripeCustomerId });

    if (!subscription.active) {
      return res.status(402).json({ code: 'SUBSCRIPTION_REQUIRED', error: 'Assinatura ativa necessária' });
    }

    return next();
  } catch (e) {
    return res.status(500).json({ code: 'SUBSCRIPTION_CHECK_FAILED', error: e.message || 'Failed to verify subscription' });
  }
}

