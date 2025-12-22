import { View, Text, Alert } from 'react-native'
import React from 'react'
import { useAuth } from '../../../context/authContext.js'
import { StatusBar } from 'expo-status-bar';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useState, useEffect, useCallback } from 'react';
import ChatList from '../../../components/ChatList.js';
import { query, getDocs, where } from 'firebase/firestore';
import { usersRef }  from '../../../firebaseConfig.js';
import Loading from '../../../components/Loading.js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function Chat() {
    const {logout, user} = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const getUsers = useCallback(async ()=>{
        try {
            setLoading(true);
        // fetch users
            const q = query(usersRef);

            const querySnapshot = await getDocs(q);

            console.log('Query returned:', querySnapshot.size, 'documents'); // Debug log

            let data = [];
            querySnapshot.forEach(doc=>{
                if(doc.id !== user?.uid) {
                    data.push({id: doc.id, ...doc.data()});
                }
            });
            console.log('Processed users:', data.length); // Debug log
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users: ', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(()=>{
        if(user?.uid) {
            getUsers();
        }
    },[]);

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />
            {
                loading ? (
                    <View className="flex items-center" style={{top: hp(30)}}>
                        <Loading size={hp(10)} />
                        <Text>{user.uid}</Text>
                    </View>
                ) : users.length > 0 ? (
                    <ChatList currentUser={user} users={users} />
                ) : (
                    <Text style={{textAlign: 'center', marginTop: hp(30)}}>
                        No users found
                    </Text>
                )
            }
        </View>
    )
}
