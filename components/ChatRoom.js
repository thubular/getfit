import { View, Text, TouchableOpacity, TextInput, Keyboard } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ChatRoomHeader from './ChatRoomHeader.js';
import MessageList from './MessageList.js';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Feather } from '@expo/vector-icons';
import CustomKeyboardView from './CustomKeyboardView.js';
import { useAuth } from '../context/authContext.js';
import { getRoomId } from '../utils/common.js';
import { Timestamp, doc, setDoc, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

export default function ChatRoom() {

    const item = useLocalSearchParams(); // second user
    const {user} = useAuth(); // logged in user
    const router = useRouter(); 
    const [messages, setMessages] = useState([]);
    const textRef = useRef('');
    const inputRef = useRef(null);
    const scrollViewRef = useRef(null);


    useEffect(()=> {
        createRoomIfNotExists();
        let roomId = getRoomId(user?.userId, item?.userId);
        const docRef = doc(db, "rooms", roomId);
        const messagesRef = collection(docRef, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        let unsub = onSnapshot(q, (snapshot)=>{
            let allMessages = snapshot.docs.map(doc=>{
                return doc.data();
            });
            setMessages([...allMessages]);
        });

        // Pushes keyboard below last message when opening keyboard 
        const KeyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow', updateScrollView
        )

        return ()=>{
            unsub();
            KeyboardDidShowListener.remove();
        }
    }, []);

    useEffect(()=>{
        updateScrollView();
    }, [messages]);

    const updateScrollView = ()=>{
        setTimeout(()=>{
            scrollViewRef?.current?.scrollToEnd({animated: false})
        },100)
    }

    const createRoomIfNotExists = async ()=>{
        // check if room exists between the two users
        // if not, create a new room in firestore
        // roomId
        let roomId = getRoomId(user?.userId, item?.userId);
        await setDoc(doc(db, "rooms", roomId), {
            roomId,
            createdAt: Timestamp.fromDate(new Date())
        });
    }

    const handleSendMessage = async ()=>{
        let message = textRef.current.trim();
        if(!message) return;
        try {
            // attach roomId to each message
            let roomId = getRoomId(user?.userId, item?.userId);
            // will reference the document created in createRoomIfNotExists
            const docRef = doc(db, 'rooms', roomId);
            // create a collection for the messages inside this document
            const messagesRef = collection(docRef, 'messages');
            textRef.current = "";
            if(inputRef.current) inputRef?.current.clear();

            const newDoc = await addDoc(messagesRef, {
                userId: user?.userId,
                text: message,
                profileUrl: user?.profileUrl,
                senderName: user?.username,
                createdAt: Timestamp.fromDate(new Date())
            });

            console.log('new message id: ', newDoc.id);

        }catch(err){
            Alert.alert('Message', err.message);
        }
    }

    console.log('messages: ', messages);

    return (
        <CustomKeyboardView inChat={true}>
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />
            <ChatRoomHeader user={item} router={router} />
            <View className="h-3 border-b border-neutral-200" />
            <View className="flex-1 justify-between bg-neutral-100 overflow-visible">
                <View className="flex-1">
                    <MessageList scrollViewRef={scrollViewRef} messages={messages} currentUser={user} />
                </View>
                <View style={{marginBottom: hp(2.7)}} className="pt-2">
                        <View className="flex-row mx-3 justify-between bg-white border p-2 border-neutral-300 rounded-full pl-5">
                            <TextInput
                                ref={inputRef}
                                onChangeText={value=>textRef.current = value}
                                placeholder='Type message...'
                                style={{fontSize: hp(2)}}
                                className="flex-1 mr-2"
                            />
                            <TouchableOpacity onPress={handleSendMessage} className="bg-neutral-200 p-2 mr-[1px] rounded-full">
                                <Feather name="send" size={hp(2.7)} color="#737373" />
                            </TouchableOpacity>
                        </View>
                </View>
            </View>
        </View>
        </CustomKeyboardView>
    )

}  
