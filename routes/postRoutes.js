import express from 'express';
import { getPosts, createPost, getPost, refreshPost, updatePost, deletePost, likePost } from '../controllers/postController.js';

const router = express.Router();

// 게시글 목록 조회
router.get('/posts', getPosts);

// 게시글 작성
router.post('/makepost', createPost);

// 특정 게시글 조회
router.get('/post/:id', getPost);

// 특정 게시글 새로고침
router.post('/post/:id', refreshPost);

// 게시글 수정
router.patch('/post/:id', updatePost);

// 게시글 삭제
router.delete('/post/:id', deletePost);

// 게시글 좋아요
router.post('/post/:id/like', likePost);

export default router;