import { Text, View, Button, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useAuth } from '../../../context/authContext';
import StripeAddress from '../../../components/StripeAddress';
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import Loading from '../../../components/Loading';
import { Image } from 'expo-image';
import { defaultPicture } from '../../../utils/common.js';

export default function Profile() {
    const { user, updateUserData } = useAuth();
    const router = useRouter();
    const profileRef = useRef('');
    const inputRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        try {
            router.push('../checkoutForm');
        } catch (error) {
            console.error(error);
            Alert.alert("Network Error", "Could not connect to server");
        }
        if (user?.id) {
            setLoading(true);
            await updateUserData(user.id);
            setLoading(false);
        }
    };

    const handleResubscribe = async () => {
        try {
            const subscriptionId = user?.subscription?.subscription_id;

            if (!subscriptionId) {
                Alert.alert('Error', 'We could not detect an active subscription ID attached to your account.');
                return;
            }

            const response = await fetch('http://localhost:3000/resubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId })
            });

            const data = await response.json();

            if (data.error) {
                Alert.alert('Error', data.error);
            } else {
                Alert.alert(
                    'Subscription Resubscribed',
                    'Your subscription has been successfully resubscribed!'
                );
                if (user?.id) {
                    setLoading(true);
                    // Add a tiny delay so the Stripe Webhook has time to update the database
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await updateUserData(user.id);
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error("Resubscription frontend error:", error);
            Alert.alert('Network Error', 'Failed to securely connect to the resubscription endpoint.');
        }
    }

    const cancelSubscription = async () => {
        try {
            const subscriptionId = user?.subscription?.subscription_id;

            if (!subscriptionId) {
                Alert.alert('Error', 'We could not detect an active subscription ID attached to your account.');
                return;
            }

            const response = await fetch('http://localhost:3000/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId })
            });

            const data = await response.json();

            if (data.error) {
                Alert.alert('Error', data.error);
            } else {
                Alert.alert(
                    'Subscription Cancelled',
                    'Your subscription has been scheduled to cancel at the end of your current billing cycle! You will continue to have access until then.'
                );
                if (user?.id) {
                    setLoading(true);
                    // Add a tiny delay so the Stripe Webhook has time to update the database
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await updateUserData(user.id);
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error("Cancellation frontend error:", error);
            Alert.alert('Network Error', 'Failed to securely connect to the cancellation endpoint.');
        }
    };

    const updateProfile = async () => {
        setLoading(true);
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
        if (user?.id) await updateUserData(user.id);
        setLoading(false);
    }

    return (
        <View className="flex-1 bg-white px-5 pt-8 items-center">
            {loading && <Loading />}

            {/* Profile Picture */}
            <View className="mb-6 shadow-sm">
                <Image
                    source={user?.profileUrl ? { uri: user.profileUrl } : defaultPicture}
                    style={{ height: hp(20), width: hp(20) }}
                    className="rounded-full"
                />
            </View>

            {/* Profile Input */}
            <View className="flex-row px-4 bg-gray-50 items-center rounded-2xl w-full mb-6 h-14 border border-gray-200">
                <Feather name="image" size={20} color="gray" />
                <TextInput
                    ref={inputRef}
                    onChangeText={value => profileRef.current = value}
                    className="flex-1 font-medium text-gray-700 ml-3 text-base"
                    placeholder='Paste new profile image URL'
                    placeholderTextColor={'gray'}
                    autoCapitalize="none"
                />
            </View>

            {/* Action Buttons */}
            <View className="w-full gap-4">
                <TouchableOpacity onPress={updateProfile}
                    className="bg-[#4592a1] rounded-2xl justify-center items-center h-14 shadow-sm"
                >
                    <Text className="text-white font-bold text-lg tracking-wide">
                        Update Profile Picture
                    </Text>
                </TouchableOpacity>

                {/* Show 'Subscribe Now' when inactive */}
                {user?.userType === 'user' && (user?.subscription.status === 'inactive' || user?.subscription.status === 'canceled') && (
                    <TouchableOpacity onPress={handleSubscribe}
                        className="bg-[#4592a1] rounded-2xl justify-center items-center h-14 shadow-sm mt-2"
                    >
                        <Text className="text-white font-bold text-lg tracking-wide">
                            Subscribe Now
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Show Active Status & Cancel logic */}
                {user?.userType === 'user' && user?.subscription.status === 'active' && (
                    <View className="bg-gray-50 p-5 rounded-2xl border border-gray-200 mt-2 gap-4 shadow-sm">
                        {user?.subscription.cancel_at_period_end ? (
                            <>
                                <Text className="text-center font-medium text-gray-600 leading-6">
                                    Your subscription is canceled.{'\n'}
                                    You have full access until:{'\n'}
                                    <Text className="font-bold text-gray-800 text-lg">{user?.subscription.current_period_end.substring(0, 10)}</Text>
                                </Text>
                                <TouchableOpacity onPress={handleResubscribe}
                                    className="bg-[#4592a1] rounded-2xl justify-center items-center h-14 mt-2"
                                >
                                    <Text className="text-white font-bold text-lg tracking-wide">
                                        Resubscribe
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text className="text-center font-medium text-gray-600 text-base">
                                    Next billing date: <Text className="font-bold text-gray-800">{user?.subscription.current_period_end.substring(0, 10)}</Text>
                                </Text>
                                <TouchableOpacity onPress={cancelSubscription}
                                    className="bg-red-500 rounded-2xl justify-center items-center h-14 mt-2"
                                >
                                    <Text className="text-white font-bold text-lg tracking-wide">
                                        Cancel Subscription
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}
