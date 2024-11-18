import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import router from './routes/userRoutes.js'

dotenv.config()

const app = express()
app.use(express.json());
const PORT = process.env.PORT || 3000

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://127.0.0.1:5500']

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }),
)

app.use('/', router);

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: '서버 오류가 발생했습니다.', error: err.message })
})


app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`)
})