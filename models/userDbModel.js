import {promises as fileSystem} from 'fs';
const filePath = '../data/users.json';

class UserDbModel {
    static #getUserInfo(data, email) {
        const users = JSON.parse(data);
        const userInfo = users.find(user => user.email === email);
        if (!userInfo) return {};
        return userInfo;
    };

    static async getUserInfo(email) {
        try {
            const data = await fileSystem.readFile(filePath, 'utf-8');
            return this.#getUserInfo(data, email);
        } catch (error) {
            console.error(error);
        }
    };
};

export default UserDbModel;