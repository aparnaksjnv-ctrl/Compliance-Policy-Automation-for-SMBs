import { app } from './app'
import { connectDB } from './db'
import { config } from './config'

async function main() {
  try {
    console.log(`[week2-api] DB mode: ${config.useInMemory ? 'in-memory' : 'mongodb'}`)
    await connectDB()
    const port = config.port
    const host = '0.0.0.0'
    app.listen(port, host, () => {
      console.log(`[week2-api] listening on http://${host}:${port}`)
    })
  } catch (err) {
    console.error('[week2-api] failed to start:', err)
    process.exit(1)
  }
}

if (require.main === module) {
  void main()
}
