import { conn } from '../db.js';
import fs from 'fs/promises';
import path from 'path';

export default class PostModel {
    static async getAllPosts() {
        try {
            const connection = await conn.getConnection();
            const query = `
                SELECT 
                    p.*,
                    COUNT(DISTINCT pl.user_id) as likes,
                    COUNT(DISTINCT r.id) as replies,
                    JSON_ARRAYAGG(DISTINCT pl.user_id) as liked_by
                FROM posts p
                LEFT JOIN post_likes pl ON p.id = pl.post_id
                LEFT JOIN replies r ON p.id = r.post_id
                GROUP BY p.id
                ORDER BY p.created_at DESC
            `;
            const rows = await connection.query(query);
            connection.release();
            
            // null liked_by를 빈 배열로 변환
            return rows.map(row => ({
                ...row,
                likedBy: row.liked_by ? row.liked_by.filter(id => id !== null) : []
            }));
        } catch (error) {
            console.error('Error in getAllPosts:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const connection = await conn.getConnection();
            const query = `
                SELECT 
                    p.*,
                    COUNT(DISTINCT pl.user_id) as likes,
                    COUNT(DISTINCT r.id) as replies,
                    JSON_ARRAYAGG(DISTINCT pl.user_id) as liked_by
                FROM posts p
                LEFT JOIN post_likes pl ON p.id = pl.post_id
                LEFT JOIN replies r ON p.id = r.post_id
                WHERE p.id = ?
                GROUP BY p.id
            `;
            const rows = await connection.query(query, [id]);
            connection.release();
            
            if (rows.length === 0) return null;
            
            const post = rows[0];
            return {
                ...post,
                likedBy: post.liked_by ? post.liked_by.filter(id => id !== null) : []
            };
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    static async createPost(postData) {
        try {
            const connection = await conn.getConnection();
            const result = await connection.query(
                'INSERT INTO posts (user_id, title, content, image, views) VALUES (?, ?, ?, ?, 0)',
                [postData.userId, postData.title, postData.content, postData.image]
            );
            
            const newPost = await this.findById(result.insertId);
            connection.release();
            return newPost;
        } catch (error) {
            console.error('Error in createPost:', error);
            throw error;
        }
    }

    static async updatePost(postId, postData) {
        try {
            const connection = await conn.getConnection();
            await connection.beginTransaction();

            try {
                const currentPost = await this.findById(postId);
                if (!currentPost) {
                    throw new Error('게시글을 찾을 수 없습니다.');
                }

                // 이미지 처리
                if (postData.image && currentPost.image && currentPost.image !== postData.image) {
                    try {
                        const imagePath = currentPost.image.slice(1);
                        await fs.unlink(path.join(process.cwd(), imagePath));
                    } catch (error) {
                        console.error('이전 이미지 삭제 실패:', error);
                    }
                }

                const updateFields = [];
                const updateValues = [];

                if (postData.title !== undefined) {
                    updateFields.push('title = ?');
                    updateValues.push(postData.title);
                }
                if (postData.content !== undefined) {
                    updateFields.push('content = ?');
                    updateValues.push(postData.content);
                }
                if (postData.image !== undefined) {
                    updateFields.push('image = ?');
                    updateValues.push(postData.image);
                }
                if (postData.views !== undefined) {
                    updateFields.push('views = ?');
                    updateValues.push(postData.views);
                }

                if (updateFields.length > 0) {
                    const query = `
                        UPDATE posts 
                        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `;
                    await connection.query(query, [...updateValues, postId]);
                }

                await connection.commit();
                const updatedPost = await this.findById(postId);
                connection.release();
                return updatedPost;
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error in updatePost:', error);
            throw error;
        }
    }

    static async deletePost(postId) {
        try {
            const connection = await conn.getConnection();
            const post = await this.findById(postId);
            
            if (!post) {
                throw new Error('게시글을 찾을 수 없습니다.');
            }

            // 이미지 파일 삭제
            if (post.image) {
                try {
                    const imagePath = post.image.slice(1);
                    await fs.unlink(path.join(process.cwd(), imagePath));
                } catch (error) {
                    console.error('이미지 삭제 실패:', error);
                }
            }

            await connection.query('DELETE FROM posts WHERE id = ?', [postId]);
            connection.release();
        } catch (error) {
            console.error('Error in deletePost:', error);
            throw error;
        }
    }

    /* static async deleteUserPost(userId) {
        try {
            const connection = await conn.getConnection();
            
            // 삭제할 게시글들의 정보를 먼저 가져옴
            const posts = await connection.query(
                'SELECT * FROM posts WHERE user_id = ?',
                [userId]
            );

            // 이미지 파일들 삭제
            for (const post of posts) {
                if (post.image) {
                    try {
                        const imagePath = post.image.replace('http://localhost:3000/', '');
                        await fs.unlink(path.join(process.cwd(), imagePath));
                    } catch (error) {
                        console.error('이미지 삭제 실패:', error);
                    }
                }
            }

            // 게시글 삭제 (foreign key cascade로 인해 관련 likes와 replies도 자동 삭제)
            // await connection.query('DELETE FROM posts WHERE user_id = ?', [userId]);
            
            connection.release();
            return posts;
        } catch (error) {
            console.error('Error in deleteUserPost:', error);
            throw error;
        }
    } */

    static async toggleLike(postId, userId) {
        try {
            const connection = await conn.getConnection();
            
            // 현재 좋아요 상태 확인
            const [existingLike] = await connection.query(
                'SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?',
                [postId, userId]
            );
    
            if (existingLike) {
                // 좋아요가 있으면 삭제
                await connection.query(
                    'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
                    [postId, userId]
                );
            } else {
                // 좋아요가 없으면 추가
                await connection.query(
                    'INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)',
                    [postId, userId]
                );
            }
    
            connection.release();
            return !existingLike; // 좋아요 상태 반환 (true: 추가됨, false: 삭제됨)
        } catch (error) {
            console.error('Error in toggleLike:', error);
            throw error;
        }
    }
}