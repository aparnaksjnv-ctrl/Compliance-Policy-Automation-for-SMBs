import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import healthRouter from './routes/health'
import authRouter from './routes/auth'
import policiesRouter from './routes/policies'
import auditsRouter from './routes/audits'
import assessmentsRouter from './routes/assessments'
import vendorsRouter from './routes/vendors'
import activitiesRouter from './routes/activities'
import billingRouter from './routes/billing'

export const app = express()

app.use(helmet())
app.use(cors({ origin: config.corsOrigin, credentials: false }))
// Ensure preflight (OPTIONS) requests are handled for all routes
app.options('*', cors({ origin: config.corsOrigin }))
// Stripe webhook must read the raw body for signature verification
app.post('/billing/webhook', express.raw({ type: 'application/json' }), async (req: any, res) => {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || ''
    if (!secret) return res.status(200).send() // silently ignore if not configured
    const mod: any = await (new Function('m', 'return import(m)'))('stripe')
    const Stripe = mod.default || mod
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })
    const sig = req.headers['stripe-signature']
    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret)
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const sub = event.data.object
      const userId = sub?.metadata?.userId
      if (userId) {
        const { User } = await import('./models/User')
        const u: any = await (User as any).findById(userId)
        if (u) {
          u.stripeSubscriptionId = sub.id
          u.subscriptionStatus = sub.status
          await u.save()
        }
      }
    }
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const userId = sub?.metadata?.userId
      if (userId) {
        const { User } = await import('./models/User')
        const u: any = await (User as any).findById(userId)
        if (u) {
          u.subscriptionStatus = 'canceled'
          await u.save()
        }
      }
    }
    res.json({ received: true })
  } catch {
    res.status(200).send()
  }
})
app.use(express.json({ limit: '1mb' }))
app.use(rateLimit({ windowMs: 60_000, max: 120 }))

app.use('/health', healthRouter)
app.use('/auth', authRouter)
app.use('/policies', policiesRouter)
app.use('/audits', auditsRouter)
app.use('/assessments', assessmentsRouter)
app.use('/vendors', vendorsRouter)
app.use('/activities', activitiesRouter)
app.use('/billing', billingRouter)

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'week2-api' })
})

export default app
