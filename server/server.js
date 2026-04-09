const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase-admin/app');

require('dotenv').config({ path: '../server/.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const YOUR_DOMAIN = 'http://localhost:8081';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const admin = require("firebase-admin");

const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


const app = express();
const PORT = process.env.PORT || 3000;


const handleInvoicePaymentSucceeded = async (invoice, userID) => {
    console.log('we are in handleInvoicePaymentSucceeded');
    const db = admin.firestore();

    if (!userID) {
        console.warn('⚠️ No userID found for invoice. Skipping DB update.');
        return;
    }
}

const handlePaymentIntentSucceeded = async (paymentIntent, userID) => {
    console.log('we are in handlePaymentIntentSucceeded');
    const db = admin.firestore();

    if (!userID) {
        console.warn('⚠️ No userID found in paymentIntent metadata. Skipping DB update.');
        return;
    }
}

// Handle Stripe webhook events
// POST /webhook
// stripe listen --forward-to localhost:3000/webhook
app.post('/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                req.headers['stripe-signature'],
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.log(err);
            console.log(`⚠️  Webhook signature verification failed.`);
            console.log(
                `⚠️  Check the env file and enter the correct webhook secret.`
            );
            return res.sendStatus(400);
        }
        // Extract the object from the event
        const dataObject = event.data.object;

        const db = admin.firestore();

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded': {
                console.log('we are in payment_intent.succeeded');
                const paymentIntent = event.data.object;
                // If the PaymentIntent belongs to an invoice, let `invoice.payment_succeeded` handle it
                if (paymentIntent.invoice) {
                    console.log(`PaymentIntent is associated with an invoice. Skipping to prevent double-booking.`);
                    break;
                }
                console.log(`PaymentIntent for ${paymentIntent.amount} under user ${paymentIntent.metadata?.userID} was successful!`);
                await handlePaymentIntentSucceeded(paymentIntent, paymentIntent.metadata?.userID);
                break;
            }
            case 'invoice.payment_succeeded': {
                console.log('we are in invoice.payment_succeeded');
                const invoice = event.data.object;
                let userID = invoice.metadata && invoice.metadata.userID;

                // If the invoice doesn't explicitly log the userID, pull it from the attached subscription
                if (!userID && invoice.subscription) {
                    const subscriptionInfo = await stripe.subscriptions.retrieve(invoice.subscription);
                    userID = subscriptionInfo.metadata && subscriptionInfo.metadata.userID;
                }

                console.log(`Invoice payment of ${invoice.amount_paid} for user ${userID} was successful!`);
                await handleInvoicePaymentSucceeded(invoice, userID);
                break;
            }
            case 'payment_method.attached': {
                const paymentMethod = event.data.object;
                // Then define and call a method to handle the successful attachment of a PaymentMethod
                // handlePaymentMethodAttached(paymentMethod);
                break;
            }
            case 'customer.subscription.created': {
                console.log('we are in customer.subscription.created');
                const subscription = event.data.object;
                let userID = subscription.metadata && subscription.metadata.userID;

                if (userID) {
                    const db = admin.firestore();
                    // Update Firebase with the latest subscription status
                    await db.collection('users').doc(userID).set({
                        subscription: {
                            status: subscription.status,
                            stripeSubscriptionId: subscription.id,
                            currentPeriodEnd: subscription.items.data[0].current_period_end ? admin.firestore.Timestamp.fromMillis(subscription.items.data[0].current_period_end * 1000) : null,
                            cancelAtPeriodEnd: false
                        }
                    }, { merge: true });

                    console.log(`✅ Updated subscription status for user ${userID} to '${subscription.status}'`);
                }
                break;
            }
            case 'customer.subscription.updated': {
                console.log('we are in customer.subscription.updated');
                const subscription = event.data.object;
                let userID = subscription.metadata && subscription.metadata.userID;

                if (userID) {
                    const db = admin.firestore();
                    await db.collection('users').doc(userID).set({
                        subscription: {
                            status: subscription.status,
                            stripeSubscriptionId: subscription.id,
                            currentPeriodEnd: subscription.items.data[0].current_period_end ? admin.firestore.Timestamp.fromMillis(subscription.items.data[0].current_period_end * 1000) : null,
                            cancelAtPeriodEnd: subscription.cancel_at_period_end
                        }
                    }, { merge: true });

                    console.log(`✅ Updated subscription status for user ${userID} to '${subscription.status}'`);
                }
                break;
            }
            default:
                // Unexpected event type
                console.log(`Unhandled event type ${event.type}.`);
        }

        // Return a 200 response to acknowledge receipt of the event
        res.sendStatus(200);
    }
);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('trust proxy', true);
app.use(express.static("."));

// Routes
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Fetch external data (such as prices) from Stripe
app.get('/fetch-external-data', async (req, res) => {
    try {
        const prices = await stripe.prices.list();
        const products = await stripe.products.list();
        res.json({
            prices: prices.data,
            products: products.data
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        })
    }
});

app.post('/create-confirm-intent', async (req, res) => {
    try {
        const intent = await stripe.paymentIntent.create({
            confirm: true,
            amount: req.body.amount,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            confirmation_token: req.body.confirmationTokenId,
            metadata: {
                userID: req.body.userID
            },
            return_url: `${YOUR_DOMAIN}/complete`,
        });
        res.json({
            client_secret: intent.client_secret,
            status: intent.status
        });
    } catch (err) {
        res.json({
            error: err
        })
    }
});

app.post('/create-subscription', async (req, res) => {
    try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(req.body.userID);
        const userDoc = await userRef.get();
        let customerId;

        // Retrieve existing customer or create a new one
        if (userDoc.exists && userDoc.data().stripeCustomerId) {
            customerId = userDoc.data().stripeCustomerId;
        } else {
            const customer = await stripe.customers.create({
                metadata: { userID: req.body.userID }
            });
            customerId = customer.id;
            // Save the newly created stripe customer ID to Firestore
            await userRef.set({ stripeCustomerId: customerId }, { merge: true });
        }

        // Create the subscription with incomplete payment behavior
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{
                price: req.body.priceId, // e.g. 'price_xxxx' created in your Stripe Dashboard
            }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            billing_mode: { type: 'flexible' },
            expand: ['latest_invoice.confirmation_secret'],
            metadata: { userID: req.body.userID }
        });

        // Pass client secret to frontend
        res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice?.confirmation_secret.client_secret,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});

app.post('/update-address', async (req, res) => {
    try {
        const { userID, addressData } = req.body;

        const db = admin.firestore();
        const userRef = db.collection('users').doc(userID);

        const userDoc = await userRef.get();
        const stripeCustomerId = userDoc.data().stripeCustomerId;

        // Update Firebase
        await userRef.set({
            billingName: addressData.name,
            billingAddress: addressData.address,
            updatedAt: new Date()
        }, { merge: true });

        res.json({ success: true, message: "Address saved to Firebase and Stripe." });
    } catch (err) {
        console.error(err);
        res.sendStatus(500).json({ error: err.message });
    }

});

app.post('/cancel-subscription', async (req, res) => {
    try {
        const { subscriptionId, userID } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({ error: 'Subscription ID is required.' });
        }

        // Setting cancel_at_period_end means they keep access until the billing cycle ends.
        // If you prefer to cancel immediately and cut off access, use:
        // await stripe.subscriptions.cancel(subscriptionId);
        const subscription = await stripe.subscriptions.update(
            subscriptionId,
            { cancel_at_period_end: true }
        );

        // Update your DB immediately here (or let your webhooks handle it automatically!)
        const db = admin.firestore();
        await db.collection('users').doc(userID).set({
            subscription: {
                cancelAtPeriodEnd: true
            }
        }, { merge: true });

        res.json({ success: true, status: subscription.status });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});

app.post('/reactivate-subscription', async (req, res) => {
    try {
        const { subscriptionId, userID } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({ error: 'Subscription ID is required.' });
        }

        // Setting cancel_at_period_end to false reactivates the subscription!
        const subscription = await stripe.subscriptions.update(
            subscriptionId,
            { cancel_at_period_end: false }
        );

        const db = admin.firestore();
        await db.collection('users').doc(userID).set({
            subscription: {
                cancelAtPeriodEnd: false
            }
        }, { merge: true });

        res.json({ success: true, status: subscription.status });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Node server listening on port ${PORT}`);
});