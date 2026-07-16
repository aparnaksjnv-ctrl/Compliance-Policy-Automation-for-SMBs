import dotenv from 'dotenv'
dotenv.config()

import { app } from './app'
import { connectDB } from './db'

async function main() {
  try {
    await connectDB()
    console.log('Connected to MongoDB Atlas')

    const port = parseInt(process.env.PORT || '5000', 10)
    const host = '0.0.0.0'
    app.listen(port, host, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (err) {
    console.error('[week4-api] failed to start:', err)
    process.exit(1)
  }
}

if (require.main === module) {
  void main()
}
