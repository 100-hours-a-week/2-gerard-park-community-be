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
            createdAt: new Date().toISOString(),
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
        users[userIndex] = { ...users[userIndex], ...userData };
        users[userIndex].updatedAt = new Date().toISOString();
        await this.saveUsers(users);
        return users[userIndex];
    }

    static async deleteUser(userId) {
        const users = await this.getAllUsers();
        const updatedUsers = users.filter(user => user.id !== userId);
        if (users.length === updatedUsers.length) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }
        await this.saveUsers(updatedUsers);
    }

    static async getAllUsers() {
        try {
            const data = await fs.readFile(USER_FILE_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
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