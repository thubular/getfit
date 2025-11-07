import { Stack, Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import React from 'react'
import HomeHeader from '../../components/HomeHeader'

export default function _layout() {
    return (
        <Tabs>
            <Tabs.Screen 
                name="home" 
                options={{
                    title: "Home",
                    header: ()=> <HomeHeader />
                }} 
            />
            <Tabs.Screen 
                name="feed" 
                options={{
                    title: "Feed"
                }} 
            />
            <Tabs.Screen 
                name="schedule" 
                options={{
                    title: "Schedule"
                }} 
            />
            <Tabs.Screen 
                name="chat" 
                options={{
                    title: "Chat"
                }} 
            />
        </Tabs>
    )
}