import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import userRouter from './routes/user.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.use('/api/user', userRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`DevScore BE running on http://localhost:${PORT}`)
})
