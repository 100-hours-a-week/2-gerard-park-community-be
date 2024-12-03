import fs from 'fs/promises';
import path from 'path';

const REPLY_FILE_PATH = path.join(process.cwd(), '/data', '/replies.json');

export default class ReplyModel {
    static async getAllReplies() {
        try {
            const data = await fs.readFile(REPLY_FILE_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    static async findById(id) {
        const replies = await this.getAllReplies();
        return replies.find(reply => reply.id === id);
    }

    static async findByPostId(postId) {
        const replies = await this.getAllReplies();
        return replies.filter(reply => reply.postId === postId);
    }

    static async createReply(replyData) {
        const replies = await this.getAllReplies();
        let lastId = 0;
        if (replies.length != 0) {
            const index = replies.length - 1;
            lastId = replies[index].id;
        }
        const newReply = {
            id: lastId + 1,
            createdAt: new Date().toISOString(),
            ...replyData
        };
        replies.push(newReply);
        await this.saveReplies(replies);
        return newReply;
    }

    static async updateReply(replyId, replyData) {
        const replies = await this.getAllReplies();
        const replyIndex = replies.findIndex(reply => reply.id === replyId);
        if (replyIndex === -1) {
            throw new Error('댓글을 찾을 수 없습니다.');
        }
        replies[replyIndex] = { ...replies[replyIndex], ...replyData };
        await this.saveReplies(replies);
        return replies[replyIndex];
    }

    static async deleteReply(replyId) {
        const replies = await this.getAllReplies();
        const updatedReplies = replies.filter(reply => reply.id !== replyId);
        if (replies.length === updatedReplies.length) {
            throw new Error('댓글을 찾을 수 없습니다.');
        }
        await this.saveReplies(updatedReplies);
    }

    // 게시글 삭제시 게시글에 달린 댓글 삭제
    static async deletePostReply(postId) {
        const replies = await this.getAllReplies();
        const updatedReplies = replies.filter(reply => reply.postId !== postId);
        /* if (replies.length === updatedReplies.length) {
            throw new Error('댓글을 찾을 수 없습니다.');
        } */
        await this.saveReplies(updatedReplies);
    }

    // 회원 삭제시 그 회원이 작성한 댓글 삭제
    static async deleteUserReply(userId) {
        const replies = await this.getAllReplies();
        const updatedReplies = replies.filter(reply => reply.userId !== userId);
        /* if (replies.length === updatedReplies.length) {
            throw new Error('댓글을 찾을 수 없습니다.');
        } */
        await this.saveReplies(updatedReplies);
    }

    static async saveReplies(replies) {
        await fs.writeFile(REPLY_FILE_PATH, JSON.stringify(replies, null, 2));
    }
}