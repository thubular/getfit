// StripeAddress.native.jsx
import { AddressElement, StripeProvider } from '@stripe/stripe-react-native';
export default function StripeAddress() {
    return (
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
            <AddressElement options={{ mode: 'billing' }} address={{ country: 'US' }} />
        </StripeProvider>
    );
}