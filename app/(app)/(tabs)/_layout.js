import { Tabs, router, usePathname } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import HomeHeader from '../../../components/HomeHeader';
import { useAuth } from '../../../context/authContext';
import { View, Text, Pressable, useWindowDimensions, StyleSheet, Platform, Image, Alert } from 'react-native';
import { useState } from 'react';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import { MenuItem } from '../../../components/CustomMenuItems.js';
import { Feather, AntDesign } from '@expo/vector-icons';

export default function TabLayout() {
    const { user, logout } = useAuth();
    const isSubscribed = user?.subscription?.status === 'active';
    const { width } = useWindowDimensions();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Assume desktop format if on Web and window width > 768
    const isDesktop = Platform.OS === 'web' && width > 768;

    const navItems = [
        { name: 'home', title: 'Home', icon: 'home', IconFamily: FontAwesome },
        { name: 'profile', title: 'Profile', icon: 'user', IconFamily: FontAwesome6 },
        ...(isSubscribed || user?.userType === 'admin' ? [
            { name: 'schedule', title: 'Schedule', icon: 'calendar', IconFamily: FontAwesome },
            { name: 'chat', title: 'Chat', icon: 'message', IconFamily: FontAwesome6 }
        ] : [])
    ];

    const handleLogout = async () => {
        console.log('Starting logout...');
        try {
            const result = await logout();
            console.log('Logout result:', result);
            if (result.success) {
                Alert.alert('Logged out', 'You have been logged out successfully.');
            } else {
                Alert.alert('Logout Failed', result.msg);
            }
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'An error occurred during logout.');
        }
    }

    const Sidebar = () => (
        <View style={[styles.sidebar, { width: isCollapsed ? 80 : 250 }]}>
            <Pressable
                onPress={() => setIsCollapsed(!isCollapsed)}
                style={[styles.collapseButton, isCollapsed && { alignSelf: 'center' }]}
            >
                <FontAwesome name="bars" size={24} color="#333" />
            </Pressable>

            <View style={{ flex: 1 }}>
                {navItems.map((item) => {
                    const isActive = pathname.includes(item.name) || (pathname === '/' && item.name === 'home');
                    return (
                        <Pressable
                            key={item.name}
                            style={[styles.sidebarItem, isActive && styles.sidebarItemActive, isCollapsed && { paddingHorizontal: 0, justifyContent: 'center' }]}
                            onPress={() => router.push(`/${item.name}`)}
                        >
                            <item.IconFamily name={item.icon} size={24} color={isActive ? '#4592a1' : '#666'} style={styles.icon} />
                            {!isCollapsed && (
                                <Text style={[styles.sidebarText, isActive && styles.sidebarTextActive]}>
                                    {item.title}
                                </Text>
                            )}
                        </Pressable>
                    );
                })}
            </View>

            <View style={[styles.profileSection, isCollapsed && { paddingHorizontal: 0, alignItems: 'center' }]}>
                <Menu>
                    <MenuTrigger customStyles={{
                        triggerWrapper: {
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: isCollapsed ? 'center' : 'flex-start'
                        }
                    }}>
                        <Image source={user?.profileUrl} style={{ height: hp(4.3), aspectRatio: 1, borderRadius: 100 }} />
                        {!isCollapsed && <Text style={styles.profileName}>{user?.username || 'Profile'}</Text>}
                    </MenuTrigger>
                    <MenuOptions customStyles={{
                        optionsContainer: {
                            borderRadius: 10,
                            borderCurve: 'continuous',
                            marginTop: -50,     // Menu pops up slightly above the image
                            marginLeft: isCollapsed ? 40 : 60,
                            backgroundColor: 'white',
                            shadowOpacity: 0.2,
                            shadowOffset: {width: 0, height: 0},
                            width: 160
                        }
                    }}>
                        <MenuItem 
                            text="Sign Out"
                            action={handleLogout}
                            value={null}
                            icon={<AntDesign name="logout" size={hp(2.5)} color="#737373" />}
                        />
                    </MenuOptions>
                </Menu>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {isDesktop && <Sidebar />}

            <View style={styles.mainContent}>
                <Tabs screenOptions={{
                    tabBarActiveTintColor: '#4592a1',
                    // Hide the bottom native tab bar when on desktop web
                    tabBarStyle: isDesktop ? { display: 'none' } : {}
                }}>
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
                            href: (isSubscribed || user?.userType === 'admin') ? undefined : null,
                        }}
                    />
                    <Tabs.Screen
                        name="chat"
                        options={{
                            title: "Chat",
                            tabBarIcon: ({ color }) => <FontAwesome6 name="message" size={28} color={color} />,
                            href: (isSubscribed || user?.userType === 'admin') ? undefined : null,
                        }}
                    />
                </Tabs>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    mainContent: {
        flex: 1,
    },
    sidebar: {
        backgroundColor: '#fff',
        borderRightWidth: 1,
        borderRightColor: '#eee',
        paddingTop: 20,
        // Drop shadow
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 100,
    },
    collapseButton: {
        padding: 16,
        paddingHorizontal: 24,
        marginBottom: 20,
        alignSelf: 'flex-end',
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    sidebarItemActive: {
        backgroundColor: '#eaf4f6',
        borderRightWidth: 4,
        borderRightColor: '#4592a1',
    },
    icon: {
        width: 30,
        textAlign: 'center',
    },
    sidebarText: {
        fontSize: 18,
        marginLeft: 16,
        color: '#666',
        fontWeight: '500',
    },
    sidebarTextActive: {
        color: '#4592a1',
        fontWeight: 'bold',
    },
    profileSection: {
        padding: 16,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginBottom: 20,
    },
    profileName: {
        fontSize: 16,
        marginLeft: 12,
        fontWeight: 'bold',
        color: '#333'
    }
});