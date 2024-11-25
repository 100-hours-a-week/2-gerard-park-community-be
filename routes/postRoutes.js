import express from 'express';
import { getPosts, createPost, getPost, updatePost, deletePost } from '../controllers/postController.js';

const router = express.Router();

// 게시글 목록 조회
router.get('/posts', getPosts);

// 게시글 작성
router.post('/makepost', createPost);

// 특정 게시글 조회
router.get('/post/:id', getPost);

// 게시글 수정
router.patch('/post/:id', updatePost);

// 게시글 삭제
router.delete('/post/:id', deletePost);

export default router;