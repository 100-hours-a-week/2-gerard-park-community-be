import { conn } from '../db.js';

export default class ReplyModel {
    static async getAllReplies() {
        try {
            const connection = await conn.getConnection();
            const query = `
                SELECT r.*, 
                       u.username,
                       u.profile_image as profileImage
                FROM replies r
                LEFT JOIN users u ON r.user_id = u.id
                ORDER BY r.created_at DESC
            `;
            const rows = await connection.query(query);
            connection.release();
            return rows;
        } catch (error) {
            console.error('Error in getAllReplies:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const connection = await conn.getConnection();
            const query = `
                SELECT r.*, 
                       u.username,
                       u.profile_image as profileImage
                FROM replies r
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.id = ?
            `;
            const [reply] = await connection.query(query, [id]);
            connection.release();
            return reply || null;
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    static async findByPostId(postId) {
        try {
            const connection = await conn.getConnection();
            const query = `
                SELECT r.*, 
                       u.username,
                       u.profile_image as profileImage
                FROM replies r
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.post_id = ?
                ORDER BY r.created_at ASC
            `;
            const replies = await connection.query(query, [postId]);
            connection.release();
            return replies;
        } catch (error) {
            console.error('Error in findByPostId:', error);
            throw error;
        }
    }

    static async createReply(replyData) {
        try {
            const connection = await conn.getConnection();
            await connection.beginTransaction();

            try {
                // 댓글 생성
                const result = await connection.query(
                    'INSERT INTO replies (post_id, user_id, content) VALUES (?, ?, ?)',
                    [replyData.postId, replyData.userId, replyData.content]
                );

                await connection.commit();
                
                // 생성된 댓글 정보 조회
                const newReply = await this.findById(result.insertId);
                connection.release();
                return newReply;
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error in createReply:', error);
            throw error;
        }
    }

    static async updateReply(replyId, replyData) {
        try {
            const connection = await conn.getConnection();
            await connection.query(
                'UPDATE replies SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [replyData.content, replyId]
            );
            
            const updatedReply = await this.findById(replyId);
            connection.release();
            return updatedReply;
        } catch (error) {
            console.error('Error in updateReply:', error);
            throw error;
        }
    }

    static async deleteReply(replyId) {
        try {
            const connection = await conn.getConnection();
            await connection.beginTransaction();

            try {
                // 댓글 정보 조회 (게시글 ID 필요)
                const [reply] = await connection.query(
                    'SELECT post_id FROM replies WHERE id = ?',
                    [replyId]
                );

                if (!reply) {
                    throw new Error('댓글을 찾을 수 없습니다.');
                }

                // 댓글 삭제
                await connection.query('DELETE FROM replies WHERE id = ?', [replyId]);

                await connection.commit();
                connection.release();
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error in deleteReply:', error);
            throw error;
        }
    }

    /* static async deletePostReply(postId) {
        try {
            const connection = await conn.getConnection();
            // CASCADE로 자동 삭제되므로 별도 처리 불필요
            // await connection.query('DELETE FROM replies WHERE post_id = ?', [postId]);
            connection.release();
        } catch (error) {
            console.error('Error in deletePostReply:', error);
            throw error;
        }
    }

    static async deleteUserReply(userId) {
        try {
            const connection = await conn.getConnection();
            await connection.beginTransaction();

            try {
                // 유저의 댓글이 달린 게시글들의 댓글 수 감소
                await connection.query(`
                    UPDATE posts p
                    JOIN replies r ON p.id = r.post_id
                    SET p.replies = p.replies - 1
                    WHERE r.user_id = ?
                `, [userId]);

                // CASCADE로 자동 삭제되므로 별도 처리 불필요
                // await connection.query('DELETE FROM replies WHERE user_id = ?', [userId]);

                await connection.commit();
                connection.release();
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error in deleteUserReply:', error);
            throw error;
        }
    } */
}