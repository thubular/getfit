import { Text, View, Button, Alert } from 'react-native';
import { useAuth } from '../../../context/authContext';
import StripeAddress from '../../../components/StripeAddress';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function Profile() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    }

    const handleSubscribe = async () => {
        try {
            router.push('../checkoutForm');
        } catch (error) {
            console.error(error);
            Alert.alert("Network Error", "Could not connect to server");
        }
    };

    return (
        <View>
            <Text>Profile</Text>
            <Button title="Subscribe Now" onPress={handleSubscribe} />
            <Button title="Logout" onPress={handleLogout} />
        </View>
    );
}
