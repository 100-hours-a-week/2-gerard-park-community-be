import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import replyRouter from './routes/replyRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const profilesDir = path.join(__dirname, 'uploads', 'profiles');
if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
}


const allowedOrigins = ['http://3.39.195.183', 'http://3.39.195.183:5500', 'http://localhost:5500'];
/* process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://127.0.0.1:5500'] */

app.use(
    cors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true,
    }),
)
app.set('trust proxy'.true);
app.use(express.json());

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다.', error: err.message });
})

app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false, // HTTPS에서만 쿠키 전송 def=true
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24시간
    }
}))
// 정적 파일 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/board', postRouter);
app.use('/board', replyRouter);

app.listen(PORT, () => {
    console.log(`server is running at ${PORT}`);
})