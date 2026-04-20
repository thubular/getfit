import { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { defaultPicture } from '../../utils/common';
import { supabase } from '../../lib/supabase';

export default function ChatRoom({ roomId, userId }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isFetching, setIsFetching] = useState(true);
    useEffect(() => {
        // initial fetch of old messages
        fetchMessages();
        // set up the realtime websocket subscription
        const subscription = supabase
            .channel(`room: ${roomId}`) // unique chatroom name
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `room_id=eq.${roomId}` // only get messages for this room
            }, async (payload) => {
                const newMessage = payload.new;

                // Realtime payloads don't include SQL JOINs automatically.
                // We need to fetch the profile info for the user who just sent this!
                const { data: profileData } = await supabase
                    .from('public_profiles')
                    .select('username, profileUrl')
                    .eq('id', newMessage.user_id)
                    .single();

                if (profileData) {
                    newMessage.public_profiles = profileData;
                }

                // add the new message to the array instantly
                setMessages((prevMessages) => [newMessage, ...prevMessages]);
            })
            .subscribe();
        // clean up the websocket when the user leaves the screen
        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);
    const fetchMessages = async () => {
        setIsFetching(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*, public_profiles(username, profileUrl)')
            .eq('room_id', roomId)
            .order('created_at', { ascending: false }) // newest first
            .limit(50);

        if (data) {
            setMessages(data);
        }
        setIsFetching(false);
    };
    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const contentToSend = inputText;
        setInputText(''); // instantly clear input for UX

        const { error } = await supabase.from('messages').insert([
            { room_id: roomId, user_id: userId, content: contentToSend }
        ]);

        if (error) {
            console.error("Supabase Insert Error:", error);
            alert("Failed to send message: " + error.message);
        }
    };
    return (
        <View style={{ flex: 1, padding: 16 }}>
            {isFetching ? (
                <ActivityIndicator size="large" color="darkcyan" style={{ flex: 1, justifyContent: 'center' }} />
            ) : (
                <FlatList
                    data={messages}
                    inverted={true}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const isMe = item.user_id === userId;
                        return (
                            <View style={{
                                flexDirection: isMe ? 'row-reverse' : 'row',
                                alignItems: 'flex-end',
                                marginVertical: 5,
                                paddingHorizontal: 10,
                                gap: 10
                            }}>
                                {!isMe && (
                                    <Image
                                        style={{ height: 35, width: 35, borderRadius: 100 }}
                                        source={item.public_profiles?.profileUrl || defaultPicture}
                                        placeholder={defaultPicture}
                                        transition={500}
                                    />
                                )}
                                <View style={{
                                    padding: 10,
                                    backgroundColor: isMe ? 'darkcyan' : '#E5E5EA',
                                    borderRadius: 16,
                                    borderBottomRightRadius: isMe ? 4 : 16,
                                    borderBottomLeftRadius: !isMe ? 4 : 16,
                                    flexShrink: 1,
                                    maxWidth: '80%'
                                }}>
                                    {!isMe && (
                                        <Text style={{ fontWeight: 'bold', marginBottom: 2, fontSize: 12, color: '#666' }}>
                                            {item.public_profiles?.username || 'Unknown User'}
                                        </Text>
                                    )}
                                    <Text style={{ color: isMe ? '#fff' : '#000', fontSize: 16 }}>{item.content}</Text>
                                </View>
                            </View>
                        );
                    }}
                />
            )}
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TextInput
                    style={{ flex: 1, borderWidth: 1, padding: 10, borderRadius: 8, borderColor: '#ccc' }}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                />
                <Button title="Send" onPress={sendMessage} />
            </View>
        </View>
    );
}
