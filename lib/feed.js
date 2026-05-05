import { supabase } from './supabase';

export const feedService = {
    // Fetches posts with user profile info and counts
    async fetchPosts(currentUserId) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    public_profiles!user_id (
                        username,
                        profileUrl
                    ),
                    likes (
                        user_id
                    ),
                    comments (
                        id
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data) return [];

            // Transform data to include counts and isLiked boolean
            return data.map(post => ({
                ...post,
                likeCount: post.likes ? post.likes.length : 0,
                commentCount: post.comments ? post.comments.length : 0,
                isLiked: post.likes ? post.likes.some(like => like.user_id === currentUserId) : false,
                // Clean up nested arrays
                likes: undefined,
                comments: undefined
            }));
        } catch (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }
    },

    // Uploads an image to Supabase Storage
    async uploadImage(uri) {
        try {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            const filePath = `posts/${fileName}`;

            // Fetch the image and convert to blob
            const response = await fetch(uri);
            const blob = await response.blob();

            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(filePath, blob, {
                    contentType: 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('post-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },

    // Creates a new post
    async createPost(userId, content, imageUrl = null) {
        const { data, error } = await supabase
            .from('posts')
            .insert([{ user_id: userId, content, image_url: imageUrl }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Toggles a like for a post
    async toggleLike(userId, postId, isCurrentlyLiked) {
        if (isCurrentlyLiked) {
            const { error } = await supabase
                .from('likes')
                .delete()
                .match({ user_id: userId, post_id: postId });

            if (error) throw error;
            return { liked: false };
        } else {
            const { error } = await supabase
                .from('likes')
                .insert([{ user_id: userId, post_id: postId }]);

            if (error) throw error;
            return { liked: true };
        }
    },

    // Fetches comments for a specific post
    async fetchComments(postId) {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                public_profiles!user_id (
                    username,
                    profileUrl
                )
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Adds a comment to a post
    async addComment(userId, postId, content) {
        const { data, error } = await supabase
            .from('comments')
            .insert([{ user_id: userId, post_id: postId, content }])
            .select(`
                *,
                public_profiles!user_id (
                    username,
                    profileUrl
                )
            `)
            .single();

        if (error) throw error;
        return data;
    }
};
