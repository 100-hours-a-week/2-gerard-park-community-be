import PostModel from '../models/postDbModel.js';
import UserModel from '../models/userDbModel.js';
import multer from 'multer';
import path from 'path';

// 파일 업로드 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
}).single('image');

export const getPosts = async (req, res) => {
    try {
        const posts = await PostModel.getAllPosts();
        const postsWithUserInfo = await Promise.all(posts.map(async (post) => {
            const user = await UserModel.findById(post.user_id);
            return {
                ...post,
                username: user ? user.username : 'Unknown User',
                profileImage: user ? user.profile_image : null
            };
        }));
        res.json(postsWithUserInfo);
    } catch (error) {
        res.status(500).json({ message: '게시글 목록을 불러오는데 실패했습니다.', error: error.message });
    }
};

export const createPost = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: '파일 업로드 실패', error: err.message });
        }

        try {
            const { title, content } = req.body;
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).json({ message: '로그인이 필요합니다.' });
            }

            if (!title || !content) {
                return res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
            }

            const newPost = await PostModel.createPost({
                userId,
                title,
                content,
                image: req.file ? `/uploads/${req.file.filename}` : null, // 경로는 나중에 바꿔줘야함
            });

            res.status(201).json(newPost);
        } catch (error) {
            res.status(500).json({ message: '게시글 작성에 실패했습니다.', error: error.message });
        }
    });
};

export const getPost = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.session.userId;
        const post = await PostModel.findById(postId);

        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 조회수 증가 (같은 사용자가 아닐 경우에만)
        if (post.userId !== userId) {
            post.views = (post.views || 0) + 1;
            await PostModel.updatePost(postId, { views: post.views });
        }

        const isLiked = post.likedBy.includes(userId);
        const emoji = isLiked ? '❤️' : '🤍';

        const user = await UserModel.findById(post.user_id);

        res.json({
            ...post,
            username: user ? user.username : 'Unknown User',
            profileImage: user ? user.profile_image : null,
            emoji
        });
    } catch (error) {
        res.status(500).json({ message: '게시글을 불러오는데 실패했습니다.', error: error.message });
    }
};

export const refreshPost = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.session.userId;
        const post = await PostModel.findById(postId);

        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        const isLiked = post.likedBy.includes(userId);
        const emoji = isLiked ? '❤️' : '🤍';

        const user = await UserModel.findById(post.user_id);

        res.json({
            ...post,
            username: user ? user.username : 'Unknown User',
            profileImage: user ? user.profile_image : null,
            emoji
        });
    } catch (error) {
        res.status(500).json({ message: '게시글을 불러오는데 실패했습니다.', error: error.message });
    }
};

export const updatePost = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: '파일 업로드 실패', error: err.message });
        }

        try {
            const postId = parseInt(req.params.id);
            const { title, content } = req.body;
            const userId = req.session.userId;

            const post = await PostModel.findById(postId);

            if (!post) {
                return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
            }

            if (post.user_id !== userId) {
                return res.status(403).json({ message: '게시글을 수정할 권한이 없습니다.' });
            }

            const updateData = {
                title,
                content,
            };

            if(req.file) {
                updateData.image = `/uploads/${req.file.filename}`;
            }

            const updatedPost = await PostModel.updatePost(postId, updateData);

            res.json({ message: '게시글을 수정했습니다.', updatedPost});
        } catch (error) {
            res.status(500).json({ message: '게시글 수정에 실패했습니다.', error: error.message });
        }
    });
};

export const deletePost = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.session.userId;

        const post = await PostModel.findById(postId);

        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        if (post.user_id !== userId) {
            return res.status(403).json({ message: '게시글을 삭제할 권한이 없습니다.' });
        }

        await PostModel.deletePost(postId);
        res.json({ message: '게시글이 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: '게시글 삭제에 실패했습니다.', error: error.message });
    }
};

export const likePost = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // toggleLike 메서드 사용 - 반환값은 좋아요가 추가되었는지(true) 삭제되었는지(false) 나타냄
        const isLiked = await PostModel.toggleLike(postId, userId);
        
        // 업데이트된 게시글 정보를 가져옴
        const updatedPost = await PostModel.findById(postId);
        
        res.json({ 
            message: isLiked ? '좋아요가 추가되었습니다.' : '좋아요가 취소되었습니다.',
            likes: updatedPost.likes,
            isLiked: isLiked
        });
    } catch (error) {
        res.status(500).json({ message: '좋아요 처리에 실패했습니다.', error: error.message });
    }
};