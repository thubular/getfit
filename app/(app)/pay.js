// Stripe checkout form
import {
    AddressElement,
    PaymentElement,
    useElements,
    useStripe
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { useAuth } from "../../context/authContext";

// TODO: Show card form on default, have the option to switch to a saved card if available
export default function Pay({ priceId, userID }) {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();

    // addressData will store new address info if user fills it out
    const [addressData, setAddressData] = useState(null);

    const [errorMessage, setErrorMessage] = useState();
    const [loading, setLoading] = useState(false);

    const handleError = (error) => {
        setLoading(false);
        setErrorMessage(error.message);
    }

    const handleSubmit = async (event) => {
        // Don't want default form submission to happen here,
        // which would refresh the page
        event.preventDefault();

        if (!stripe) {
            // Stripe.js hasn't yet loaded.
            // Make sure to disable form submission until Stripe.js has loaded.
            return;
        }
        setLoading(true);

        // Trigger form validation and wallet collection
        const { error: submitError } = await elements.submit();
        if (submitError) {
            handleError(submitError);
            return;
        }

        // If the user entered/modified their address, save it to Firebase
        if (addressData) {
            try {
                await fetch('http://localhost:3000/update-address', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userID: userID,
                        addressData: addressData
                    }),
                });
            } catch (err) {
                console.error("Failed to update address in backend", err);
            }
        }

        // Create the Subscription on the backend
        const res = await fetch('http://localhost:3000/create-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                priceId: priceId, // e.g., 'price_1...' from your Stripe Dashboard
                userID: userID
            }),
        });

        const jsonResponse = await res.json();
        if (jsonResponse.error) {
            handleError({ message: `Backend Error: ${jsonResponse.error}` });
            return;
        }

        const { type, clientSecret } = jsonResponse;
        console.log("Client Secret Received:", clientSecret);
        const confirmIntent = type === 'setup' ? stripe.confirmSetup : stripe.confirmPayment;

        const { error } = await confirmIntent({
            elements,
            clientSecret,
            confirmParams: {
                return_url: 'http://localhost:8081/complete',
            },
        });

        if (error) {
            handleError(error);
        } else {

        }
    };

    const handleServerResponse = async (response) => {
        if (response.error) {
            // Show error from server on payment form
            handleError({ message: response.error.message || "An error occurred" });
        } else if (response.status === "requires_action") {
            // Use Stripe.js to handle the required next action
            const {
                error,
                paymentIntent
            } = await stripe.handleNextAction({
                clientSecret: response.client_secret
            });

            if (error) {
                // Show error from Stripe.js in payment form
                handleError(error);
            } else {
                // Actions handled, show success message
                window.location.href = `/complete?payment_intent_client_secret=${paymentIntent.client_secret}&redirect_status=${paymentIntent.status}`;
            }
        } else {
            // No actions needed, show success message
            window.location.href = `/complete?payment_intent=${paymentIntent.id}&client_secret=${paymentIntent.client_secret}&redirect_status=${paymentIntent.status}`;
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <AddressElement
                    options={{
                        mode: 'billing',
                        defaultValues: {
                            name: user?.billingName || '',
                            address: user?.billingAddress || {}
                        }
                    }}
                    onChange={(event) => {
                        if (event.complete) {
                            setAddressData({
                                name: event.value.name,
                                address: event.value.address,
                            });
                        } else {
                            setAddressData(null);
                        }
                    }}
                />
                <PaymentElement />
                <button type="submit" disabled={!stripe || loading}>
                    Submit
                </button>
                {errorMessage && <div>{errorMessage}</div>}
            </form>
        </>
    );
}