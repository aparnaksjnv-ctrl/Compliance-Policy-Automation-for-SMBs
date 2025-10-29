import { Router } from 'express'
import { authMiddleware, AuthedRequest } from '../middleware/auth'
import { User } from '../models/User'

const router = Router()
const DEMO_MODE = process.env.STRIPE_DEMO_MODE === 'true'

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || ''
  if (!key) throw new Error('Stripe not configured')
  const mod: any = await (new Function('m', 'return import(m)'))('stripe')
  const Stripe = mod.default || mod
  const stripe = new Stripe(key, { apiVersion: '2023-10-16' })
  return stripe
}

router.get('/status', authMiddleware, async (req: AuthedRequest, res) => {
  const user = await User.findById(req.userId).lean()
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  res.json({
    status: (user as any).subscriptionStatus || 'none',
    stripeCustomerId: (user as any).stripeCustomerId || undefined,
    stripeSubscriptionId: (user as any).stripeSubscriptionId || undefined,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  })
})

router.post('/create-checkout', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const priceIdFromBody: string | undefined = (req.body && req.body.priceId) || undefined
    const priceIdEnv = process.env.STRIPE_PRICE_ID || ''
    const priceId = priceIdFromBody || priceIdEnv
    const missingStripeConfig = !process.env.STRIPE_SECRET_KEY || !priceId
    if (DEMO_MODE || missingStripeConfig) {
      const user = await User.findById(req.userId)
      if (!user) return res.status(401).json({ error: 'Unauthorized' })
      ;(user as any).subscriptionStatus = 'active'
      ;(user as any).stripeCustomerId = (user as any).stripeCustomerId || `demo_cus_${String(user._id).slice(-6)}`
      ;(user as any).stripeSubscriptionId = (user as any).stripeSubscriptionId || `demo_sub_${String(user._id).slice(-6)}`
      await user.save()
      const successUrl = process.env.STRIPE_SUCCESS_URL || 'http://localhost:5174/?billing=success'
      return res.json({ url: successUrl })
    }
    if (!priceId) return res.status(400).json({ error: 'Missing STRIPE_PRICE_ID' })

    const stripe = await getStripe()
    const user = await User.findById(req.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    let customerId = (user as any).stripeCustomerId as string | undefined
    if (!customerId) {
      const cust = await stripe.customers.create({
        email: user.email,
        metadata: { userId: String(user._id) },
      })
      customerId = cust.id
      ;(user as any).stripeCustomerId = customerId
      await user.save()
    }

    const successUrl = process.env.STRIPE_SUCCESS_URL || 'http://localhost:5174/?billing=success'
    const cancelUrl = process.env.STRIPE_CANCEL_URL || 'http://localhost:5174/?billing=cancel'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: String(user._id) },
    })

    res.json({ url: session.url })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Checkout failed' })
  }
})

router.post('/portal', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const missingStripeConfig = !process.env.STRIPE_SECRET_KEY
    if (DEMO_MODE || missingStripeConfig) {
      const returnUrl = process.env.STRIPE_PORTAL_RETURN_URL || 'http://localhost:5174/settings'
      return res.json({ url: returnUrl })
    }
    const stripe = await getStripe()
    const user = await User.findById(req.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    const customerId = (user as any).stripeCustomerId
    if (!customerId) return res.status(400).json({ error: 'No Stripe customer found' })

    const returnUrl = process.env.STRIPE_PORTAL_RETURN_URL || 'http://localhost:5174/settings'
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl })
    res.json({ url: session.url })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Portal failed' })
  }
})

export default router
