import express from 'express';
import { getReplies, createReply, updateReply, deleteReply } from '../controllers/replyController.js';

const router = express.Router();

// 특정 게시글의 댓글 목록 조회
router.get('/post/:postId/replies', getReplies);

// 댓글 작성
router.post('/post/:postId/reply', createReply);

// 댓글 수정
router.patch('/reply/:id', updateReply);

// 댓글 삭제
router.delete('/reply/:id', deleteReply);

export default router;