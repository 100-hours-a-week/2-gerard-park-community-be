import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import session from 'express-session'
import authRouter from './routes/authRoutes.js'
import userRouter from './routes/userRoutes.js'
import postRouter from './routes/postRoutes.js'
import replyRouter from './routes/replyRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins = ['http://127.0.0.1:5500'];
/* process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://127.0.0.1:5500'] */

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }),
)
app.set('trust proxy'. true);
app.use(express.json());

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: '서버 오류가 발생했습니다.', error: err.message })
})

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // HTTPS에서만 쿠키 전송 def=true
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    sameSite: 'Lax' //def='Lax'
  }
}))

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/board', postRouter);
app.use('/board', replyRouter);

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`)
})