import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { feedService } from '../lib/feed';
import { formatDate, defaultPicture } from '../utils/common';

export default function CommentModal({ visible, onClose, onCommentAdded, post, currentUser }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (visible && post?.id) {
            loadComments();
        }
    }, [visible, post?.id]);

    const loadComments = async () => {
        setLoading(true);
        try {
            const data = await feedService.fetchComments(post.id);
            setComments(data);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const originalComments = [...comments];
        const tempCommentText = commentText;
        
        // Optimistic UI Update
        const tempComment = {
            id: Date.now().toString(),
            content: tempCommentText,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            public_profiles: {
                username: currentUser.username,
                profileUrl: currentUser.profileUrl
            }
        };

        setComments(prev => [...prev, tempComment]);
        setCommentText('');
        if (onCommentAdded) onCommentAdded(post.id);

        try {
            const newComment = await feedService.addComment(currentUser.id, post.id, tempCommentText);
            // Replace temp comment with real one from DB
            setComments(prev => prev.map(c => c.id === tempComment.id ? newComment : c));
        } catch (error) {
            console.error('Error adding comment:', error);
            // Rollback
            setComments(originalComments);
            setCommentText(tempCommentText);
            // Notify parent to decrement count
            if (onCommentAdded) onCommentAdded(post.id, true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="bg-white rounded-t-[40px] h-[80%] shadow-xl"
                >
                    {/* Header */}
                    <View className="flex-row justify-between items-center px-6 py-5 border-b border-gray-100">
                        <Text className="text-xl font-bold text-gray-800">Comments</Text>
                        <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                            <Feather name="x" size={20} color="gray" />
                        </TouchableOpacity>
                    </View>

                    {/* Comments List */}
                    <View className="flex-1">
                        {loading ? (
                            <View className="flex-1 justify-center items-center">
                                <ActivityIndicator size="large" color="#4592a1" />
                            </View>
                        ) : (
                            <FlatList
                                data={comments}
                                keyExtractor={item => item.id}
                                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                                renderItem={({ item }) => (
                                    <View className="flex-row gap-3 mb-6">
                                        <Image
                                            source={item.public_profiles?.profileUrl || defaultPicture}
                                            style={{ height: hp(4.5), width: hp(4.5), borderRadius: 100 }}
                                        />
                                        <View className="flex-1 bg-gray-50 p-3 rounded-2xl">
                                            <View className="flex-row justify-between mb-1">
                                                <Text className="font-bold text-gray-800 text-sm">
                                                    {item.public_profiles?.username || 'Anonymous'}
                                                </Text>
                                                <Text className="text-gray-400 text-[10px]">
                                                    {formatDate(new Date(item.created_at))}
                                                </Text>
                                            </View>
                                            <Text className="text-gray-700 text-sm leading-5">
                                                {item.content}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                ListEmptyComponent={
                                    <View className="items-center mt-20">
                                        <Feather name="message-square" size={40} color="#e2e8f0" />
                                        <Text className="text-gray-400 mt-2">No comments yet. Start the conversation!</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>

                    {/* Input Area */}
                    <View className="px-5 py-4 border-t border-gray-100 bg-white pb-10">
                        <View className="flex-row items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
                            <TextInput
                                placeholder="Write a comment..."
                                className="flex-1 text-gray-700 max-h-20"
                                value={commentText}
                                onChangeText={setCommentText}
                                multiline
                            />
                            <TouchableOpacity
                                onPress={handleAddComment}
                                disabled={!commentText.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#4592a1" />
                                ) : (
                                    <View className={`p-2 rounded-full ${commentText.trim() ? 'bg-[#4592a1]' : 'bg-transparent'}`}>
                                        <Feather
                                            name="arrow-up"
                                            size={20}
                                            color={commentText.trim() ? 'white' : '#cbd5e1'}
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
