import express from 'express'
import { updateUserInfo, updatePassword, deleteUser, getUserInfo, logout } from '../controllers/userController.js'

const router = express.Router()

const checkSessionId = (req, res, next) => {
    //const sessionId = req.headers['Authorization'];
    const sessionId = req.session.userId;
    if (!sessionId) {
        return res.status(401).json({ message: '인증되지 않은 요청입니다.' });
    }
    // 여기서 세션 ID의 유효성을 검사
    // 유효하지 않으면 401 응답
    next();
};
router.use(checkSessionId);
router.get('/user-info', getUserInfo);
router.patch('/update', updateUserInfo);
router.delete('/delete', deleteUser);
router.post('/logout', logout);
router.patch('/update-password', updatePassword);

export default router