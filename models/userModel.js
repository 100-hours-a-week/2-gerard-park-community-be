import fs from 'fs/promises';
import path from 'path';

const USER_FILE_PATH = path.join(process.cwd(), '/data', '/users.json');

export default class UserModel {
  static async findByEmail(email) {
    const users = await this.getAllUsers();
    return users.find(user => user.email === email);
  }

  static async createUser(userData) {
    const users = await this.getAllUsers();
    const newUser = {
      id: users.length + 1,
      ...userData,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    await this.saveUsers(users);
    return newUser;
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
}