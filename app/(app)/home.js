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
    const {user} = useAuth();

    console.log(user?.uid, 'user ID');
    
    return (
        <View>
            <Text>Home</Text>
        </View>
    )
}