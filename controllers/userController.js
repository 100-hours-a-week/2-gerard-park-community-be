import UserModel from '../models/userModel.js'
import bcrypt from 'bcrypt'

export const signup = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await UserModel.createUser({ email, password: hashedPassword, username });
        res.status(201).json({ message: '회원가입이 완료되었습니다.', userId: newUser.id });
    } catch (error) {
        res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await UserModel.findByEmail(email)
        if (!user) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
        }
        // 세션에 사용자 정보 저장
        req.session.userId = user.id;
        req.session.email = user.email;

        /* const sessionId = `${user.id}-${Date.now()}`;
        await UserModel.updateUserSessionId(user.id, sessionId); */
        req.session.save(err => {
            if (err) throw err;
            res.json({ sessionId: req.session.userId });
        });
    } catch (error) {
        res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
}

export const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: '로그아웃 중 오류가 발생했습니다.' });
        }
        res.clearCookie('connect.sid'); // 세션 쿠키 삭제
        res.json({ message: '로그아웃 성공' });
    })
}

export const getUserInfo = async (req, res) => {
    try {
        const obj = JSON.parse(req.rawHeaders[13]);
        const userId = obj.sessionId;
        if (!userId) {
            return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
        }
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        res.json({ email: user.email, username: user.username });
    } catch (error) {
        res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
};


export const updateUserInfo = async (req, res) => {
    try {
        const { email, username } = req.body;
        const obj = JSON.parse(req.rawHeaders[13]);
        const userId = obj.sessionId;
        if (!userId) {
            return res.status(401).json({ message: '인증되지 않은 사용자입니다.' })
        }
        const updatedUser = await UserModel.updateUser(userId, { email, username });
        res.json({ message: '회원정보가 업데이트되었습니다.', user: updatedUser });
    } catch (error) {
        res.status(400).json({ message: '회원정보 업데이트에 실패했습니다.', error: error.message })
    }
}

export const deleteUser = async (req, res) => {
    try {
        const obj = JSON.parse(req.rawHeaders[13]);
        const userId = obj.sessionId;
        if (!userId) {
            return res.status(401).json({ message: '인증되지 않은 사용자입니다.' })
        }
        await UserModel.deleteUser(userId)
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: '세션 삭제 중 오류가 발생했습니다.' })
            }
            res.clearCookie('connect.sid'); // 세션 쿠키 삭제
            res.json({ message: '회원탈퇴가 완료되었습니다.' });
        })
    } catch (error) {
        res.status(400).json({ message: '회원탈퇴에 실패했습니다.', error: error.message });
    }
}
