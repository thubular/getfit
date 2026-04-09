import { Text, View, Button, Alert, Image } from 'react-native';
import { useAuth } from '../../../context/authContext';
import StripeAddress from '../../../components/StripeAddress';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Loading from '../../../components/Loading';

export default function Profile() {
    const { user, updateUserData } = useAuth();
    const router = useRouter();
    const isSubscribed = user?.subscription?.status === 'active';
    const [loading, setLoading] = useState(false);

    const billingDateObj = user?.subscription?.currentPeriodEnd;
    let nextBillingDate = "Unknown";
    if (user?.subscription?.currentPeriodEnd) {
        const periodEnd = user.subscription.currentPeriodEnd;
        nextBillingDate = periodEnd.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscriptionId: user?.subscription?.stripeSubscriptionId,
                    userID: user?.userId
                })
            });
            const data = await response.json();
            if (data.success) {
                await updateUserData(user?.userId);
                Alert.alert("Success", "Subscription cancelled successfully");
            } else {
                Alert.alert("Cancellation failed", data.error || "Please try again later.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    const reactivateSubscription = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/reactivate-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscriptionId: user?.subscription?.stripeSubscriptionId,
                    userID: user?.userId
                })
            });
            const data = await response.json();
            if (data.success) {
                await updateUserData(user?.userId);
                Alert.alert("Success", "Subscription successfully reactivated!");
            } else {
                Alert.alert("Reactivation failed", data.error || "Please try again later.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View>
            {
                loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Loading />
                    </View>
                ) : (
                    <View>
                        <Image source={{ uri: user?.profileUrl }}
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: 50,
                                alignSelf: 'center',
                                marginTop: 20,
                                marginBottom: 20,
                            }}
                        />
                        <Text>{user?.username}</Text>
                        <Text>Age</Text>
                        <Text>Weight</Text>
                        <Text>Height</Text>
                        <Text>Fitness Goals</Text>
                        {user?.userType !== 'admin' && isSubscribed && (
                            <View>
                                {
                                    user?.subscription?.cancelAtPeriodEnd === true ? (
                                        <>
                                            <Text>Subscription ending: {nextBillingDate}</Text>
                                            <Button title="Subscribe again" onPress={reactivateSubscription} />
                                        </>
                                    ) : (
                                        <>
                                            <Text>Next billing date: {nextBillingDate}</Text>
                                            <Button title="Cancel Subscription" onPress={cancelSubscription} />
                                        </>
                                    )
                                }
                            </View>
                        )}
                        {user?.userType !== 'admin' && !isSubscribed && (
                            <View>
                                <Button title="Subscribe Now" onPress={handleSubscribe} />
                            </View>
                        )}
                    </View>
                )}
        </View>
    );
}
