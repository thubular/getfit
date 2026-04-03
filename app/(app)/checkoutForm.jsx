import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Pay from "./pay";
import { useAuth } from "../../context/authContext";
import { ScrollView } from "react-native";

const stripePromise = loadStripe('pk_test_51TEJ5gLma6zHZwMt9TMVJh40WklIADMoBpJDtOZ5PmO41zwmjJKmGX008zXQFusU9lEnCLwwTnsEmLmxDYnFPRzs00dG2X5cpU');

export default function CheckoutForm() {
    const { user } = useAuth();
    console.log(user?.uid);
    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <Elements stripe={stripePromise}
                options={{
                    mode: 'subscription',
                    amount: 1500,
                    currency: 'usd'
                }}
            >
                <Pay
                    priceId='price_1TEJRfLma6zHZwMt9bOGzskv'
                    userID={user?.uid}
                />
            </Elements>
        </ScrollView>
    )
}