import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Image } from 'expo-image';
import { blurhash, getRoomId, formatDate } from '../utils/common';
import { doc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

export default function ChatItem({item, router, noBorder, currentUser}) {
    const [lastMessage, setLastMessage] = useState(undefined);
    
    useEffect(()=> {
        let roomId = getRoomId(currentUser?.userId, item?.userId);
        const docRef = doc(db, "rooms", roomId);
        const messagesRef = collection(docRef, "messages");
        // Ensures we get the last message as the first object 
        const q = query(messagesRef, orderBy("createdAt", "desc"));
    
        let unsub = onSnapshot(q, (snapshot)=>{
            let allMessages = snapshot.docs.map(doc=>{
                return doc.data();
            });
            setLastMessage(allMessages[0]? allMessages[0]: null);
        });
    
        return unsub;
    }, []);
    
    console.log('last message: ', lastMessage);

    const openChatRoom = ()=>{
        router.push({pathname: '/chatRoom', params: item});
    }

    const renderTime = ()=>{
        if(lastMessage){
            let date = lastMessage?.createdAt;
            return formatDate(new Date(date?.seconds * 1000))
            //console.log('last message time: ', lastMessage?.createdAt);
        }
    }
    const renderLastMessage = ()=>{
        if(typeof lastMessage == 'undefined') return 'Loading...';
        if(lastMessage){
            if(currentUser?.userId == lastMessage?.userId) return "You: " + lastMessage?.text;
            return lastMessage?.text;
        }else{
            return 'Say Hi 👋';
        }
    }

    return (
        <TouchableOpacity onPress={openChatRoom} className={'flex-row justify-between mx-4 items-center gap-3 mb-4 pb-2 border-b-neutral-200'}>
            <Image 
                style={{height: hp(6), width: hp(6), borderRadius: 100  }}
                source={item?.profileUrl}
                placeholder={blurhash}
                transition={500}
            />
            {/* name and last message */}
            <View className="flex-1 gap-1">
                <View className="flex-row justify-between">
                    <Text style={{fontSize: hp(1.8)}} className="font-semibold text-neutral-800">{item?.username}</Text>
                    <Text style={{fontSize: hp(1.6)}} className="font-medium text-neutral-500 ">
                        {renderTime()}
                    </Text>
                </View>
                <Text style={{fontSize: hp(1.6)}} className="font-medium text-neutral-500">
                    {renderLastMessage()}
                </Text>
            </View>
        </TouchableOpacity>
    )
}