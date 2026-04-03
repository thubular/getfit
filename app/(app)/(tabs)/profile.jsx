import { Text, View, Button, Alert } from 'react-native';
import { useAuth } from '../../../context/authContext';
import StripeAddress from '../../../components/StripeAddress';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function Profile() {
    const { user } = useAuth();
    const router = useRouter();

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
        </View>
    );
}
