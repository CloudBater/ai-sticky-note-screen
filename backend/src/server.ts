import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import userRouter from './routes/user.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.use('/api/user', userRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const frontendDist = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(frontendDist))
  app.get('*', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`DevScore BE running on http://localhost:${PORT}`)
})
