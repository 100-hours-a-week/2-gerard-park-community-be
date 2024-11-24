import fs from 'fs/promises';
import path from 'path';

const POST_FILE_PATH = path.join(process.cwd(), '/data', '/posts.json');

export default class PostModel {
    static async getAllPosts() {
        try {
            const data = await fs.readFile(POST_FILE_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    static async findById(id) {
        const posts = await this.getAllPosts();
        return posts.find(post => post.id === id);
    }

    static async createPost(postData) {
        const posts = await this.getAllPosts();
        const newPost = {
            id: posts.length + 1,
            createdAt: new Date().toISOString(),
            ...postData
        };
        posts.push(newPost);
        await this.savePosts(posts);
        return newPost;
    }

    static async updatePost(postId, postData) {
        const posts = await this.getAllPosts();
        const postIndex = posts.findIndex(post => post.id === postId);
        if (postIndex === -1) {
            throw new Error('게시글을 찾을 수 없습니다.');
        }
        posts[postIndex] = { ...posts[postIndex], ...postData };
        await this.savePosts(posts);
        return posts[postIndex];
    }

    static async deletePost(postId) {
        const posts = await this.getAllPosts();
        const updatedPosts = posts.filter(post => post.id !== postId);
        if (posts.length === updatedPosts.length) {
            throw new Error('게시글을 찾을 수 없습니다.');
        }
        await this.savePosts(updatedPosts);
    }

    static async savePosts(posts) {
        await fs.writeFile(POST_FILE_PATH, JSON.stringify(posts, null, 2));
    }
}