import {
    Text,
    View,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    TouchableOpacity,
    Alert,
    useWindowDimensions
} from 'react-native'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../../context/authContext.js'
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { feedService } from '../../../lib/feed.js';
import PostCard from '../../../components/PostCard.js';
import CommentModal from '../../../components/CommentModal.js';
import Loading from '../../../components/Loading.js';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { defaultPicture } from '../../../utils/common.js';

export default function Home() {
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isFocused = useIsFocused();

    const numColumns = width > 768 ? 2 : 1;
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [isPosting, setIsPosting] = useState(false);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    const loadPosts = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await feedService.fetchPosts(user?.id);
            setPosts(data);
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (isFocused && user?.id) {
            loadPosts(false);
        }
    }, [isFocused, user?.id, loadPosts]);

    const onRefresh = () => {
        setRefreshing(true);
        loadPosts(false);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleCreatePost = async () => {
        if (!postContent.trim() && !selectedImage) return;

        setIsPosting(true);
        try {
            let imageUrl = null;
            if (selectedImage) {
                imageUrl = await feedService.uploadImage(selectedImage);
            }

            const newPostData = await feedService.createPost(user.id, postContent, imageUrl);

            // "Optimistically" add the post to the top of the feed
            // Bypass the need to refetch all posts by adding it directly to the state
            const optimisticPost = {
                ...newPostData,
                public_profiles: {
                    username: user.username,
                    profileUrl: user.profileUrl
                },
                likeCount: 0,
                commentCount: 0,
                isLiked: false
            };

            setPosts(prev => [optimisticPost, ...prev]);
            setPostContent('');
            setSelectedImage(null);
        } catch (error) {
            console.error('Create post error:', error);
            Alert.alert('Error', 'Failed to create post. Please try again.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleLike = async (post) => {
        // Optimistic update
        const originalPosts = [...posts];
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    isLiked: !p.isLiked,
                    likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1
                };
            }
            return p;
        }));

        try {
            await feedService.toggleLike(user.id, post.id, post.isLiked);
        } catch (error) {
            console.error('Error toggling like:', error);
            setPosts(originalPosts); // Rollback
        }
    };

    const handleComment = (post) => {
        setSelectedPost(post);
        setCommentModalVisible(true);
    };

    const handleCommentAdded = (postId, isRollback = false) => {
        // Optimistic update
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    commentCount: isRollback ? p.commentCount - 1 : p.commentCount + 1
                };
            }
            return p;
        }));
    };

    const headerComponent = useMemo(() => (
        <View className="bg-white mx-4 mt-4 mb-6 rounded-3xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center gap-3">
                <Image
                    source={user?.profileUrl || defaultPicture}
                    style={{ height: hp(5), width: hp(5), borderRadius: 100 }}
                />
                <TextInput
                    placeholder="What's on your mind?"
                    className="flex-1 text-base text-gray-700 h-10"
                    value={postContent}
                    onChangeText={setPostContent}
                    multiline
                />
                <TouchableOpacity onPress={pickImage} className="p-2">
                    <Feather name="image" size={24} color={selectedImage ? '#4592a1' : 'gray'} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleCreatePost}
                    disabled={isPosting || (!postContent.trim() && !selectedImage)}
                    className={`p-2 rounded-full ${(postContent.trim() || selectedImage) ? 'bg-[#4592a1]' : 'bg-gray-100'}`}
                >
                    {isPosting ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Feather name="send" size={20} color={(postContent.trim() || selectedImage) ? 'white' : 'gray'} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Image Preview */}
            {selectedImage && (
                <View className="mt-4 relative">
                    <Image
                        source={{ uri: selectedImage }}
                        style={{ height: hp(20), width: '100%', borderRadius: 16 }}
                        contentFit="cover"
                    />
                    <TouchableOpacity
                        onPress={() => setSelectedImage(null)}
                        className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"
                    >
                        <Feather name="x" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    ), [user?.profileUrl, postContent, isPosting, selectedImage, width]);

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <Loading />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <FlatList
                key={numColumns}
                numColumns={numColumns}
                data={posts}
                ListHeaderComponent={headerComponent}
                columnWrapperStyle={numColumns > 1 ? { paddingHorizontal: 8 } : null}
                renderItem={({ item }) => (
                    <View style={numColumns > 1 ? { flex: 1 } : null}>
                        <PostCard
                            item={item}
                            currentUser={user}
                            onLike={handleLike}
                            onComment={handleComment}
                        />
                    </View>
                )}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4592a1" />
                }
                contentContainerStyle={{
                    paddingTop: hp(2),
                    paddingBottom: hp(10),
                    width: '100%',
                    maxWidth: 1024,
                    alignSelf: 'center'
                }}
                ListEmptyComponent={
                    <View className="items-center mt-20">
                        <Feather name="layers" size={50} color="#cbd5e1" />
                        <Text className="text-gray-400 mt-4 text-lg">No posts yet. Be the first!</Text>
                    </View>
                }
            />
            <CommentModal
                visible={commentModalVisible}
                onClose={() => setCommentModalVisible(false)}
                onCommentAdded={handleCommentAdded}
                post={selectedPost}
                currentUser={user}
            />
        </View>
    );
}