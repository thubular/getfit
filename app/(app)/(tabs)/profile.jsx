import { Text, View, Button, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useAuth } from '../../../context/authContext';
import StripeAddress from '../../../components/StripeAddress';
import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

export default function Profile() {
    const { user, logout, updateUserData } = useAuth();
    const router = useRouter();
    const profileRef = useRef('');
    const inputRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        router.push('/signIn');
    }

    const handleSubscribe = async () => {
        try {
            router.push('../checkoutForm');
        } catch (error) {
            console.error(error);
            Alert.alert("Network Error", "Could not connect to server");
        }
    };

    const cancelSubscription = async () => {
    };

    const updateProfile = async () => {
        const { error } = await supabase
            .from('profiles')
            .update({ profileUrl: profileRef.current })
            .eq('id', user?.id);
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Profile updated successfully');
            profileRef.current = '';
            inputRef.current?.clear();
        }
        updateUserData();
    }

    return (
        <View>
            <Text>Profile</Text>
            <View style={{ height: hp(7) }} className="flex-row gap-4 px-4 bg-neutral-100 items-center rounded-xl">
                <Feather name="image" size={hp(2.7)} color="gray" />
                <TextInput
                    ref={inputRef}
                    onChangeText={value => profileRef.current = value}
                    style={{ fontSize: hp(2) }}
                    className="flex-1 font-semibold text-neutral-700"
                    placeholder='Profile url'
                    placeholderTextColor={'gray'}
                />
            </View>
            <View className="gap-4">
                <TouchableOpacity onPress={updateProfile}
                    style={{ height: hp(6.5), width: hp(40), backgroundColor: 'darkcyan' }}
                    className="rounded-xl justify-center items-center"
                >
                    <Text style={{ fontSize: hp(2.7) }} className="text-white font-bold tracking-wider">
                        Update profile picture
                    </Text>
                </TouchableOpacity>
                {/* Show 'Subscribe Now' or 'Cancel subscription' based on current subscription status and user type */}
                {user?.userType === 'user' && user?.subscription.status === 'inactive' && (
                    <TouchableOpacity onPress={handleSubscribe}
                        style={{ height: hp(6.5), width: hp(40), backgroundColor: 'darkcyan' }}
                        className="rounded-xl justify-center items-center"
                    >
                        <Text style={{ fontSize: hp(2.7) }} className="text-white font-bold tracking-wider">
                            Subscribe Now
                        </Text>
                    </TouchableOpacity>
                )}
                {user?.userType === 'user' && user?.subscription.status === 'active' && (
                    <TouchableOpacity onPress={handleSubscribe}
                        style={{ height: hp(6.5), width: hp(40), backgroundColor: 'darkcyan' }}
                        className="rounded-xl justify-center items-center"
                    >
                        <Text style={{ fontSize: hp(2.7) }} className="text-white font-bold tracking-wider">
                            Cancel subscription
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={handleLogout}
                    style={{ height: hp(6.5), width: hp(40), backgroundColor: 'darkcyan' }}
                    className="rounded-xl justify-center items-center"
                >
                    <Text style={{ fontSize: hp(2.7) }} className="text-white font-bold tracking-wider">
                        Logout
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
