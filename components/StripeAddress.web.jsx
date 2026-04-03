import { Elements, AddressElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);
export default function StripeAddress() {
    return (
        <Elements stripe={stripePromise}>
            <AddressElement options={{ mode: 'billing' }} address={{ country: 'US' }} />
        </Elements>
    );
}