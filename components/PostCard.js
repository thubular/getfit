import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { formatDate, defaultPicture } from '../utils/common';

export default function PostCard({ item, currentUser, onLike, onComment }) {
    const isLiked = item.isLiked;

    return (
        <View className="bg-white mx-4 mb-4 rounded-3xl p-4 shadow-sm border border-gray-100">
            {/* Header: User Info */}
            <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center gap-3">
                    <Image
                        source={item.public_profiles?.profileUrl || defaultPicture}
                        style={{ height: hp(5), width: hp(5), borderRadius: 100 }}
                        transition={500}
                    />
                    <View>
                        <Text className="font-bold text-gray-800 text-base">
                            {item.public_profiles?.username || 'Anonymous'}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                            {formatDate(new Date(item.created_at))}
                        </Text>
                    </View>
                </View>
                {/* TODO: Allow poster to delete/edit the post */}
                <TouchableOpacity>
                    <Feather name="more-horizontal" size={20} color="gray" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="mb-4">
                <Text className="text-gray-700 text-[15px] leading-6">
                    {item.content}
                </Text>
                {item.image_url && (
                    <Image
                        source={{ uri: item.image_url }}
                        style={{ width: '100%', aspectRatio: 4 / 5, borderRadius: 16, marginTop: 12, backgroundColor: '#f8fafc' }}
                        contentFit="cover"
                    />
                )}
            </View>

            {/* Footer: Actions & Stats */}
            <View className="flex-row items-center justify-between pt-3 border-t border-gray-50">
                <View className="flex-row gap-6">
                    {/* Like Button */}
                    <TouchableOpacity
                        onPress={() => onLike(item)}
                        className="flex-row items-center gap-2"
                    >
                        <Feather
                            name="heart"
                            size={20}
                            color={isLiked ? '#ef4444' : '#6b7280'}
                            fill={isLiked ? '#ef4444' : 'none'}
                        />
                        <Text className={`text-sm font-medium ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>
                            {item.likeCount > 0 ? item.likeCount : 'Like'}
                        </Text>
                    </TouchableOpacity>

                    {/* Comment Button */}
                    <TouchableOpacity
                        onPress={() => onComment(item)}
                        className="flex-row items-center gap-2"
                    >
                        <Feather name="message-circle" size={20} color="#6b7280" />
                        <Text className="text-gray-500 text-sm font-medium">
                            {item.commentCount > 0 ? item.commentCount : 'Comment'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Share/Save */}
                <TouchableOpacity>
                    <Feather name="share-2" size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
