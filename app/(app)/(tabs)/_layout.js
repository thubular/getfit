import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import HomeHeader from '../../../components/HomeHeader';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#4592a1'}}>
            <Tabs.Screen 
                name="home" 
                options={{
                    title: "Home",
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={ color } />,
                    header: ()=> <HomeHeader />
                }} 
            />
            <Tabs.Screen 
                name="feed" 
                options={{
                    title: "Feed",
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="feed" color={ color } />,
                }} 
            />
            <Tabs.Screen 
                name="schedule" 
                options={{
                    title: "Schedule",
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="calendar" color={ color } />,
                }} 
            />
            <Tabs.Screen 
                name="chat" 
                options={{
                    title: "Chat",
                    tabBarIcon: ({ color }) => <FontAwesome6 name="message" size={28} color={ color } />,
                }} 
            />
        </Tabs>
    );
}