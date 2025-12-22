import { Tabs } from 'expo-router';
import HomeHeader from '../../../components/HomeHeader'

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: 'blue'}}>
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
    );
}