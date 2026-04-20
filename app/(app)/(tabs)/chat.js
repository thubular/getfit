import { View, Text, Alert } from 'react-native'
import React from 'react'
import { useAuth } from '../../../context/authContext.js'
import { StatusBar } from 'expo-status-bar';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useState, useEffect, useCallback } from 'react';
import ChatList from '../../../components/ChatList.js';
import { query, getDocs, where } from 'firebase/firestore';
import { usersRef } from '../../../firebaseConfig.js';
import Loading from '../../../components/Loading.js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import ChatRoom from '../chatRoom.js';

export default function Chat() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />
            {
                <ChatRoom roomId='052ed4ca-0b5f-43ea-a901-0cd609a374b8' userId={user?.id} />
            }
        </View>
    )
}
