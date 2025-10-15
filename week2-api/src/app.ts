import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import healthRouter from './routes/health'
import authRouter from './routes/auth'
import policiesRouter from './routes/policies'
import auditsRouter from './routes/audits'

export const app = express()

app.use(helmet())
app.use(cors({ origin: config.corsOrigin, credentials: false }))
// Ensure preflight (OPTIONS) requests are handled for all routes
app.options('*', cors({ origin: config.corsOrigin }))
app.use(express.json({ limit: '1mb' }))
app.use(rateLimit({ windowMs: 60_000, max: 120 }))

app.use('/health', healthRouter)
app.use('/auth', authRouter)
app.use('/policies', policiesRouter)
app.use('/audits', auditsRouter)

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'week2-api' })
})

export default app
