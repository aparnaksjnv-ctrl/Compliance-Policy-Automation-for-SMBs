import express from 'express'
import cors from 'cors'
import { config } from './config'
import healthRouter from './routes/health'
import authRouter from './routes/auth'
import companyRouter from './routes/company'

export const app = express()

app.use(cors({ origin: config.corsOrigin, credentials: false }))
app.use(express.json())

app.use('/health', healthRouter)
app.use('/auth', authRouter)
app.use('/company', companyRouter)

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'week1-api' })
})

export default app
