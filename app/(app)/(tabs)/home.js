/* Page seen after logging in */
import { Text, View, FlatList, Image, StyleSheet, useWindowDimensions } from 'react-native';
import React from 'react';
import { useAuth } from '../../../context/authContext.js';

const MOCK_FEED = [
    { id: '1', author: 'Alex Johnson', image: 'https://picsum.photos/600/400?random=1', title: 'Morning 10K Run 🏃‍♂️', likes: 124 },
    { id: '2', author: 'Sarah Smith', image: 'https://picsum.photos/600/400?random=2', title: 'Healthy Acai Bowl 🍓', likes: 89 },
    { id: '3', author: 'Mike Davis', image: 'https://picsum.photos/600/400?random=3', title: 'Heavy Deadlifts Today 🏋️', likes: 210 },
    { id: '4', author: 'Jessica Day', image: 'https://picsum.photos/600/400?random=4', title: 'Sunset Yoga 🧘‍♀️', likes: 302 },
    { id: '5', author: 'Nick Miller', image: 'https://picsum.photos/600/400?random=5', title: 'Trying out bouldering 🧗‍♂️', likes: 45 },
    { id: '6', author: 'Winston Bishop', image: 'https://picsum.photos/600/400?random=6', title: 'Post-workout meal 🥗', likes: 76 },
];

const MOCK_CHALLENGES = [
    { id: 'c1', title: 'Weekly Running (30km)', current: 21, target: 30, unit: 'km', color: '#4592a1' },
    { id: 'c2', title: 'Calorie Burn (5000 kcal)', current: 3200, target: 5000, unit: 'kcal', color: '#e74c3c' },
];

const MOCK_LEADERBOARD = [
    { id: 'l1', rank: 1, name: 'Jessica Day', points: 3050, avatar: 'https://picsum.photos/100/100?random=4' },
    { id: 'l2', rank: 2, name: 'Alex Johnson', points: 2840, avatar: 'https://picsum.photos/100/100?random=1' },
    { id: 'l3', rank: 3, name: 'Mike Davis', points: 2100, avatar: 'https://picsum.photos/100/100?random=3' },
];

export default function Home() {
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    
    // Switch to 1 column on mobile screens, 2 columns on tablet/desktop
    const numColumns = width > 768 ? 2 : 1;

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Weekly Challenges */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Weekly Challenges</Text>
                {MOCK_CHALLENGES.map(challenge => {
                    const progress = Math.min((challenge.current / challenge.target) * 100, 100);
                    return (
                        <View key={challenge.id} style={styles.challengeItem}>
                            <View style={styles.challengeTextRow}>
                                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                                <Text style={styles.challengeValue}>
                                    {challenge.current} / {challenge.target} {challenge.unit}
                                </Text>
                            </View>
                            <View style={styles.progressBarBackground}>
                                <View 
                                    style={[
                                        styles.progressBarFill, 
                                        { width: `${progress}%`, backgroundColor: challenge.color }
                                    ]} 
                                />
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Leaderboard */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Athletes this Week</Text>
                <View style={styles.leaderboardCard}>
                    {MOCK_LEADERBOARD.map((user, index) => (
                        <View key={user.id} style={[styles.leaderboardRow, index !== MOCK_LEADERBOARD.length - 1 && styles.borderBottom]}>
                            <View style={styles.leaderboardLeft}>
                                <Text style={[styles.rankText, user.rank === 1 && { color: '#f1c40f' }]}>
                                    #{user.rank}
                                </Text>
                                <Image source={{ uri: user.avatar }} style={styles.leaderboardAvatar} />
                                <Text style={styles.leaderboardName}>{user.name}</Text>
                            </View>
                            <Text style={styles.leaderboardPoints}>{user.points} pts</Text>
                        </View>
                    ))}
                </View>
            </View>
            
            <Text style={styles.sectionTitle}>Community Feed</Text>
        </View>
    );

    const renderItem = ({ item }) => {
        return (
            <View style={[styles.card, { flex: 1 / numColumns }]}>
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                    <Text style={styles.title}>{item.title}</Text>
                    <View style={styles.footer}>
                        <Text style={styles.author}>by {item.author}</Text>
                        <Text style={styles.likes}>❤️ {item.likes}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                // Important: Provide numColumns as a key so FlatList properly re-renders when column count changes
                key={`grid-${numColumns}`}
                data={MOCK_FEED}
                ListHeaderComponent={renderHeader}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={numColumns}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    challengeItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        // Optional shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    challengeTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    challengeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
    },
    challengeValue: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    progressBarBackground: {
        height: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    leaderboardCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    leaderboardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#888',
        width: 24,
    },
    leaderboardAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginHorizontal: 12,
    },
    leaderboardName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    leaderboardPoints: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4592a1',
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        marginHorizontal: 4,
        overflow: 'hidden',
        // Drop shadow for modern feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#e1e1e1',
    },
    cardContent: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    author: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    likes: {
        fontSize: 14,
        color: '#e74c3c',
        fontWeight: 'bold',
    },
});