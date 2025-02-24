import ReplyModel from '../models/replyModel.js';
import PostModel from '../models/postModel.js';
import UserModel from '../models/userModel.js';

export const getReplies = async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const replies = await ReplyModel.findByPostId(postId);
        for (let reply of replies) {
            const user = await UserModel.findById(reply.userId);
            reply.username =  user.username;
            reply.profileImage = user.profileImage;
        };
        res.json(replies);
    } catch (error) {
        res.status(500).json({ message: '댓글 목록을 불러오는데 실패했습니다.', error: error.message });
    }
};

export const createReply = async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const userId = req.session.userId;
        const { content } = req.body;

        if (!userId) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        if (!content) {
            return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
        }

        // 게시글 존재 여부 확인
        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        const user = await UserModel.findById(post.userId);

        const newReply = await ReplyModel.createReply({
            postId,
            userId,/* 
            profileImage: user ? user.profileImage : null,
            username: user ? user.username : 'Unknown User', */
            content
        });

        // 게시글의 댓글 수 증가
        post.replies += 1;
        await PostModel.updatePost(postId, post);

        res.status(201).json(newReply);
    } catch (error) {
        res.status(500).json({ message: '댓글 작성에 실패했습니다.', error: error.message });
    }
};

export const updateReply = async (req, res) => {
    try {
        const replyId = parseInt(req.params.id);
        const userId = req.session.userId;
        const { content } = req.body;

        const reply = await ReplyModel.findById(replyId);
        if (!reply) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }

        if (reply.userId !== userId) {
            return res.status(403).json({ message: '댓글을 수정할 권한이 없습니다.' });
        }

        const updatedReply = await ReplyModel.updateReply(replyId, {
            ...reply,
            content,
            updatedAt: new Date().toISOString()
        });

        res.json(updatedReply);
    } catch (error) {
        res.status(500).json({ message: '댓글 수정에 실패했습니다.', error: error.message });
    }
};

export const deleteReply = async (req, res) => {
    try {
        const replyId = parseInt(req.params.id);
        const userId = req.session.userId;

        const reply = await ReplyModel.findById(replyId);
        if (!reply) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }

        if (reply.userId !== userId) {
            return res.status(403).json({ message: '댓글을 삭제할 권한이 없습니다.' });
        }

        await ReplyModel.deleteReply(replyId);

        // 게시글의 댓글 수 감소
        const post = await PostModel.findById(reply.postId);
        if (post) {
            post.replies -= 1;
            await PostModel.updatePost(reply.postId, post);
        }

        res.json({ message: '댓글이 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: '댓글 삭제에 실패했습니다.', error: error.message });
    }
};