import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import healthRouter from './routes/health'
import authRouter from './routes/auth'
import policiesRouter from './routes/policies'

export const app = express()

app.use(helmet())
app.use(cors({ origin: config.corsOrigin, credentials: false }))
app.use(express.json({ limit: '1mb' }))
app.use(rateLimit({ windowMs: 60_000, max: 120 }))

app.use('/health', healthRouter)
app.use('/auth', authRouter)
app.use('/policies', policiesRouter)

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'week2-api' })
})

export default app
