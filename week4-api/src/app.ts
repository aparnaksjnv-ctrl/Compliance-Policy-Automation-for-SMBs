import express from 'express'
import cors, { CorsOptions } from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import healthRouter from './routes/health'
import authRouter from './routes/auth'
import policiesRouter from './routes/policies'
import auditsRouter from './routes/audits'
import assessmentsRouter from './routes/assessments'
import vendorsRouter from './routes/vendors'
import auditRouter from './routes/audit'
import soc2Router from './routes/soc2'
import riskRouter from './routes/risk'
import alertsRouter from './routes/alerts'
import reportsRouter from './routes/reports'

export const app = express()

const allowedOrigins = new Set([config.corsOrigin, 'http://localhost:5176', 'http://127.0.0.1:5176'])
const loopbackOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/
const corsOptions: CorsOptions = {
  credentials: false,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || loopbackOrigin.test(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('Origin is not allowed by CORS'))
  },
}

app.use(helmet())
app.use(cors(corsOptions))
// Ensure preflight (OPTIONS) requests are handled for all routes
app.options('*', cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use(rateLimit({ windowMs: 60_000, max: 120 }))

app.use('/health', healthRouter)
app.use('/auth', authRouter)
app.use('/policies', policiesRouter)
app.use('/audits', auditsRouter)
app.use('/assessments', assessmentsRouter)
app.use('/vendors', vendorsRouter)
app.use('/audit', auditRouter)
app.use('/soc2', soc2Router)
app.use('/risk', riskRouter)
app.use('/alerts', alertsRouter)
app.use('/reports', reportsRouter)
app.use('/api/policies', policiesRouter)
app.use('/api/vendors', vendorsRouter)
app.use('/api/reports', reportsRouter)

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'week4-api' })
})

export default app
