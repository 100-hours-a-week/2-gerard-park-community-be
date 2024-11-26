import PostModel from '../models/postModel.js';
import UserModel from '../models/userModel.js';
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
            const user = await UserModel.findById(post.userId);
            return {
                ...post,
                username: user ? user.username : 'Unknown User',
                profileImage: user ? user.profileImage : null
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
            //const userId = req.session.userId;
            const obj = JSON.parse(req.rawHeaders[13]);
            const userId = obj.sessionId;

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
                image: req.file ? `http://localhost:3000/uploads/${req.file.filename}` : null, // 경로는 나중에 바꿔줘야함
                likes: 0,
                views: 0,
                comments: 0
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
        //const userId = req.session.userId;
        const obj = JSON.parse(req.rawHeaders[13]);
        const userId = obj.sessionId;

        const post = await PostModel.findById(postId);

        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 조회수 증가 (같은 사용자가 아닐 경우에만)
        if (post.userId !== userId) {
            post.views += 1;
            await PostModel.updatePost(postId, post);
        }

        const user = await UserModel.findById(post.userId);

        res.json({
            ...post,
            username: user ? user.username : 'Unknown User',
            profileImage: user ? user.profileImage : null
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
            //const userId = req.session.userId;
            const obj = JSON.parse(req.rawHeaders[13]);
            const userId = obj.sessionId;

            const post = await PostModel.findById(postId);

            if (!post) {
                return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
            }

            if (post.userId !== userId) {
                return res.status(403).json({ message: '게시글을 수정할 권한이 없습니다.' });
            }

            const updatedPost = await PostModel.updatePost(postId, {
                ...post,
                title,
                content,
                image: req.file ? `/uploads/${req.file.filename}` : post.image,
                updatedAt: new Date().toISOString()
            });

            res.json(updatedPost);
        } catch (error) {
            res.status(500).json({ message: '게시글 수정에 실패했습니다.', error: error.message });
        }
    });
};

export const deletePost = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        //const userId = req.session.userId;
        const obj = JSON.parse(req.rawHeaders[13]);
        const userId = obj.sessionId;

        const post = await PostModel.findById(postId);

        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        if (post.userId !== userId) {
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
        //const userId = req.session.userId;
        const obj = JSON.parse(req.rawHeaders[13]);
        const userId = obj.sessionId;

        if (!userId) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 좋아요 수 증가
        post.likes = (post.likes || 0) + 1;
        await PostModel.updatePost(postId, post);

        res.json({
            message: '좋아요가 추가되었습니다.',
            likes: post.likes
        });
    } catch (error) {
        res.status(500).json({ message: '좋아요 처리에 실패했습니다.', error: error.message });
    }
};

/* // 게시글 검색
export const searchPosts = async (req, res) => {
    try {
        const { keyword, type } = req.query;
        if (!keyword) {
            return res.status(400).json({ message: '검색어를 입력해주세요.' });
        }

        const posts = await PostModel.getAllPosts();
        let filteredPosts;

        switch(type) {
            case 'title':
                filteredPosts = posts.filter(post => 
                    post.title.toLowerCase().includes(keyword.toLowerCase())
                );
                break;
            case 'content':
                filteredPosts = posts.filter(post => 
                    post.content.toLowerCase().includes(keyword.toLowerCase())
                );
                break;
            case 'author':
                const users = await Promise.all(posts.map(post => UserModel.findById(post.userId)));
                filteredPosts = posts.filter((post, index) => 
                    users[index] && users[index].username.toLowerCase().includes(keyword.toLowerCase())
                );
                break;
            case 'all':
            default:
                const allUsers = await Promise.all(posts.map(post => UserModel.findById(post.userId)));
                filteredPosts = posts.filter((post, index) => 
                    post.title.toLowerCase().includes(keyword.toLowerCase()) ||
                    post.content.toLowerCase().includes(keyword.toLowerCase()) ||
                    (allUsers[index] && allUsers[index].username.toLowerCase().includes(keyword.toLowerCase()))
                );
        }

        // 사용자 정보 추가
        const postsWithUserInfo = await Promise.all(filteredPosts.map(async (post) => {
            const user = await UserModel.findById(post.userId);
            const isLiked = post.likedBy && post.likedBy.includes(req.session.userId);
            return {
                ...post,
                username: user ? user.username : 'Unknown User',
                profileImage: user ? user.profileImage : null,
                isLiked
            };
        }));

        res.json(postsWithUserInfo);
    } catch (error) {
        res.status(500).json({ message: '게시글 검색에 실패했습니다.', error: error.message });
    }
};

// 내가 작성한 게시글 목록
export const getMyPosts = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const allPosts = await PostModel.getAllPosts();
        const myPosts = allPosts.filter(post => post.userId === userId);

        // 사용자 정보 추가
        const postsWithUserInfo = await Promise.all(myPosts.map(async (post) => {
            const user = await UserModel.findById(userId);
            return {
                ...post,
                username: user ? user.username : 'Unknown User',
                profileImage: user ? user.profileImage : null,
                isLiked: post.likedBy && post.likedBy.includes(userId)
            };
        }));

        res.json(postsWithUserInfo);
    } catch (error) {
        res.status(500).json({ message: '내 게시글 목록을 불러오는데 실패했습니다.', error: error.message });
    }
};

// 내가 좋아요한 게시글 목록
export const getLikedPosts = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const allPosts = await PostModel.getAllPosts();
        const likedPosts = allPosts.filter(post => 
            post.likedBy && post.likedBy.includes(userId)
        );

        // 사용자 정보 추가
        const postsWithUserInfo = await Promise.all(likedPosts.map(async (post) => {
            const user = await UserModel.findById(post.userId);
            return {
                ...post,
                username: user ? user.username : 'Unknown User',
                profileImage: user ? user.profileImage : null,
                isLiked: true
            };
        }));

        res.json(postsWithUserInfo);
    } catch (error) {
        res.status(500).json({ message: '좋아요한 게시글 목록을 불러오는데 실패했습니다.', error: error.message });
    }
}; */