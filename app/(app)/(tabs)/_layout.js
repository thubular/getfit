import { Tabs, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import HomeHeader from '../../../components/HomeHeader';
import { useAuth } from '../../../context/authContext';

export default function TabLayout() {
    const { user } = useAuth();

    const isSubscribed = user?.subscription?.status === 'active' || user?.userType === 'admin';

    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#4592a1' }}>
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
                    header: () => <HomeHeader />
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color }) => <FontAwesome6 name="user" size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    title: "Schedule",
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="calendar" color={color} />,
                    href: isSubscribed ? undefined : null,
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: "Chat",
                    tabBarIcon: ({ color }) => <FontAwesome6 name="message" size={28} color={color} />,
                    href: isSubscribed ? undefined : null,
                }}
            />
        </Tabs>
    );
}