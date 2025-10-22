/* Page seen after logging in */
import { Text, View, Pressable, ActivityIndicator } from 'react-native'
import React from 'react'
import { useAuth } from '../../context/authContext'
import { StatusBar } from 'expo-status-bar';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useState, useEffect } from 'react';
import ChatList from '../../components/ChatList.js';
import { query, getDocs, where } from 'firebase/firestore';
import { usersRef } from '../../firebaseConfig.js';
import Loading from '../../components/Loading.js';

export default function Home() {
    const {logout, user} = useAuth();
    const [users, setUsers] = useState([]);
    
    useEffect(()=>{
        if(user?.uid) {
            getUsers();
        }
    },[])
    const getUsers = async ()=>{
        // fetch users
        const q = query(usersRef, where('userId', '!=', user?.uid));

        const querySnapshot = await getDocs(q);
        let data = [];
        querySnapshot.forEach(doc=>{
            data.push({...doc.data()});
        });

        setUsers(data);
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />
            {
                users.length>0? (
                    <ChatList currentUser={user} users={users} />
                ):(
                    <View className="flex items-center" style={{top: hp(30)}}>
                        {/*<ActivityIndicator size="larger" />*/}
                        <Loading size={hp(10)} />
                    </View>
                )
            }
        </View>
    )
}