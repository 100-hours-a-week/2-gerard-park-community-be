import fs from 'fs/promises';
import path from 'path';

const USER_FILE_PATH = path.join(process.cwd(), '/data', '/users.json');

export default class UserModel {
    static async findById(id) {
        const users = await this.getAllUsers();
        return users.find(user => user.id === id);
    }

    static async findByEmail(email) {
        const users = await this.getAllUsers();
        return users.find(user => user.email === email);
    }

    static async createUser(userData) {
        const users = await this.getAllUsers();
        const newUser = {
            id: users.length + 1,
            profileImage: null, // 기본값 설정
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...userData,
        };
        users.push(newUser);
        await this.saveUsers(users);
        return newUser;
    }

    static async updateUser(userId, userData) {
        const users = await this.getAllUsers();
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex === -1) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }
        // 기존 프로필 이미지 경로 저장
        const oldProfileImage = users[userIndex].profileImage;

        users[userIndex] = { 
            ...users[userIndex], 
            ...userData,
            updatedAt: new Date().toISOString()
        };

        // 프로필 이미지가 변경되었고 이전 이미지가 있다면 삭제
        if (userData.profileImage && oldProfileImage && oldProfileImage !== userData.profileImage) {
            try {
                const imagePath = oldProfileImage.replace('http://localhost:3000/', '');
                await fs.unlink(path.join(process.cwd(), imagePath));
            } catch (error) {
                console.error('이전 프로필 이미지 삭제 실패:', error);
            }
        }
        await this.saveUsers(users);
        return users[userIndex];
    }

    static async deleteUser(userId) {
        const users = await this.getAllUsers();
        const user = users.find(user => user.id === userId);
        
        if (!user) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        // 프로필 이미지가 있다면 삭제
        if (user.profileImage) {
            try {
                const imagePath = user.profileImage.replace('http://localhost:3000/', '');
                await fs.unlink(path.join(process.cwd(), imagePath));
            } catch (error) {
                console.error('프로필 이미지 삭제 실패:', error);
            }
        }

        const updatedUsers = users.filter(user => user.id !== userId);
        await this.saveUsers(updatedUsers);
    }

    static async getAllUsers() {
        try {
            const data = await fs.readFile(USER_FILE_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // users.json 파일이 없다면 디렉토리와 파일 생성
                await fs.mkdir(path.dirname(USER_FILE_PATH), { recursive: true });
                await this.saveUsers([]);
                return [];
            }
            throw error;
        }
    }

    static async saveUsers(users) {
        await fs.writeFile(USER_FILE_PATH, JSON.stringify(users, null, 2));
    }

    static async updateUserSessionId(userId, sessionId) {
        const users = await this.getAllUsers();
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex === -1) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }
        users[userIndex].sessionId = sessionId;
        await this.saveUsers(users);
    }

}