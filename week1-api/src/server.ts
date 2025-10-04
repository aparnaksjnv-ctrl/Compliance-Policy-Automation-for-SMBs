import { app } from './app'
import { connectDB } from './db'
import { config } from './config'

async function main() {
  try {
    console.log(`[week1-api] DB mode: ${config.useInMemory ? 'in-memory' : 'mongodb'}`)
    await connectDB()
    const port = config.port
    app.listen(port, () => {
      console.log(`[week1-api] listening on http://localhost:${port}`)
    })
  } catch (err) {
    console.error('[week1-api] failed to start:', err)
    process.exit(1)
  }
}

if (require.main === module) {
  void main()
}
