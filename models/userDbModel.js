import { conn } from '../db.js';
import fs from 'fs/promises';
import path from 'path';

class UserModel {
    static async findById(id) {
        try {
            const connection = await conn.getConnection();
            const rows = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
            connection.release();
            return rows[0] || null;
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const connection = await conn.getConnection();
            const rows = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
            connection.release();
            return rows[0] || null;
        } catch (error) {
            console.error('Error in findByEmail:', error);
            throw error;
        }
    }

    static async createUser(userData) {
        try {
            const connection = await conn.getConnection();
            const result = await connection.query(
                'INSERT INTO users (email, username, password, profile_image) VALUES (?, ?, ?, ?)',
                [userData.email, userData.username, userData.password, userData.profileImage]
            );
            const newUser = await this.findById(result.insertId);
            connection.release();
            return newUser;
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    }

    static async updateUser(userId, userData) {
        try {
            const connection = await conn.getConnection();
            
            // 기존 사용자 정보 조회 (프로필 이미지 삭제를 위해)
            const currentUser = await this.findById(userId);
            if (!currentUser) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // 업데이트할 필드와 값 준비
            const updateFields = [];
            const updateValues = [];
            
            if (userData.email) {
                updateFields.push('email = ?');
                updateValues.push(userData.email);
            }
            if (userData.username) {
                updateFields.push('username = ?');
                updateValues.push(userData.username);
            }
            if (userData.password) {
                updateFields.push('password = ?');
                updateValues.push(userData.password);
            }
            if (userData.profileImage) {
                updateFields.push('profile_image = ?');
                updateValues.push(userData.profileImage);
            }

            // 기존 프로필 이미지 처리
            if (userData.profileImage && currentUser.profile_image && 
                currentUser.profile_image !== userData.profileImage) {
                try {
                    const imagePath = currentUser.profile_image.replace('http://localhost:3000/', '');
                    await fs.unlink(path.join(process.cwd(), imagePath));
                } catch (error) {
                    console.error('이전 프로필 이미지 삭제 실패:', error);
                }
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(userId);

            const query = `
                UPDATE users 
                SET ${updateFields.join(', ')}
                WHERE id = ?
            `;

            await connection.query(query, [...updateValues]);
            const updatedUser = await this.findById(userId);
            connection.release();
            return updatedUser;
        } catch (error) {
            console.error('Error in updateUser:', error);
            throw error;
        }
    }

    static async deleteUser(userId) {
        try {
            const connection = await conn.getConnection();
            const user = await this.findById(userId);
            
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // 프로필 이미지 삭제
            if (user.profile_image) {
                try {
                    const imagePath = user.profile_image.replace('http://localhost:3000/', '');
                    await fs.unlink(path.join(process.cwd(), imagePath));
                } catch (error) {
                    console.error('프로필 이미지 삭제 실패:', error);
                }
            }

            await connection.query('DELETE FROM users WHERE id = ?', [userId]);
            connection.release();
        } catch (error) {
            console.error('Error in deleteUser:', error);
            throw error;
        }
    }

    static async getAllUsers() {
        try {
            const connection = await conn.getConnection();
            const rows = await connection.query('SELECT * FROM users');
            connection.release();
            return rows;
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            throw error;
        }
    }
}

export default UserModel;