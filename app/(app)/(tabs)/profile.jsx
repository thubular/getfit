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
        <View>
            {loading && <Loading />}
            <Image
                source={{ uri: user?.profileUrl ? user.profileUrl : defaultPicture }}
                style={{ height: hp(10), width: hp(10), borderRadius: 100, }} />
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
                {/* Show 'Subscribe Now' when inactive */}
                {user?.userType === 'user' && (user?.subscription.status === 'inactive' || user?.subscription.status === 'canceled') && (
                    <View>
                        <TouchableOpacity onPress={handleSubscribe}
                            style={{ height: hp(6.5), width: hp(40), backgroundColor: 'darkcyan' }}
                            className="rounded-xl justify-center items-center"
                        >
                            <Text style={{ fontSize: hp(2.7) }} className="text-white font-bold tracking-wider">
                                Subscribe Now
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Show Active Status & Cancel logic */}
                {user?.userType === 'user' && user?.subscription.status === 'active' && (
                    <View className="gap-2">
                        {user?.subscription.cancel_at_period_end ? (
                            <>
                                <Text className="text-center font-medium text-neutral-500 mb-2">
                                    Your subscription has been canceled. You have full access until: {user?.subscription.current_period_end.substring(0, 10)}
                                </Text>
                                <TouchableOpacity onPress={handleResubscribe}
                                    style={{ height: hp(6.5), width: hp(40), backgroundColor: 'darkcyan' }}
                                    className="rounded-xl justify-center items-center"
                                >
                                    <Text style={{ fontSize: hp(2.7) }} className="text-white font-bold tracking-wider">
                                        Resubscribe
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text className="text-center font-medium text-neutral-700">Next billing date: {user?.subscription.current_period_end.substring(0, 10)}</Text>
                                <TouchableOpacity onPress={cancelSubscription}
                                    style={{ height: hp(6.5), width: hp(40), backgroundColor: '#ef4444' }} // red-500 for cancel button
                                    className="rounded-xl justify-center items-center"
                                >
                                    <Text style={{ fontSize: hp(2.7) }} className="text-white font-bold tracking-wider">
                                        Cancel subscription
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
