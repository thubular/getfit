// Stateless server that handles Stripe webhooks, user creation, and standard HTTP requests
const express = require('express');
const cors = require('cors');

require('dotenv').config({ path: '../server/.env.local' });

const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const YOUR_DOMAIN = 'http://localhost:8081';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;


const app = express();
const PORT = process.env.PORT || 3000;

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

        // Handle the event
        switch (event.type) {
            case 'customer.subscription.created': {
                console.log('we are in customer.subscription.created');
                const subscription = event.data.object;
                let userID = subscription.metadata && subscription.metadata.userID;

                if (userID) {
                    const { data, error } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            subscription: {
                                status: subscription.status,
                                subscription_id: subscription.id,
                                current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
                                cancel_at_period_end: false
                            }
                        })
                        .eq('id', userID);
                    if (error) console.error("Error updating subscription:", error);

                    console.log(`✅ Updated subscription status for user ${userID} to '${subscription.status}'`);
                }
                break;
            }
            case 'customer.subscription.updated': {
                console.log('we are in customer.subscription.updated');
                const subscription = event.data.object;
                let userID = subscription.metadata && subscription.metadata.userID;

                if (userID) {
                    const { data, error } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            subscription: {
                                status: subscription.status,
                                subscription_id: subscription.id,
                                current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
                                cancel_at_period_end: subscription.cancel_at_period_end || false
                            }
                        })
                        .eq('id', userID);
                    if (error) console.error("Error updating subscription:", error);
                    console.log(`✅ Updated subscription status for user ${userID} to '${subscription.status}'`);
                } else {
                    console.error("⚠️ Failed to update subscription: No userID found in metadata!");
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
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('subscription, stripe')
            .eq('id', req.body.userID);
        let customerId;

        // Retrieve existing customer or create a new one
        if (data && data.length > 0) {
            customerId = data[0].stripe.customer_id;
        } else {
            const customer = await stripe.customers.create({
                metadata: { userID: req.body.userID }
            });

            customerId = customer.id;
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .update({ stripe: { customer_id: customerId } })
                .eq('id', req.body.userID);
            if (error) console.error("Error updating subscription:", error);
        }

        // Create the subscription with incomplete payment behavior
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{
                price: req.body.priceId,
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

app.post('/resubscribe', async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        if (!subscriptionId) {
            return res.status(400).json({ error: "No subscription ID provided." });
        }

        const subscription = await stripe.subscriptions.update(
            subscriptionId,
            { cancel_at_period_end: false }
        );

        res.json({ success: true, subscription });
    } catch (err) {
        console.error("Resubscription Error:", err.message);
        res.status(400).json({ error: err.message });
    }
});

app.post('/cancel-subscription', async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        if (!subscriptionId) {
            return res.status(400).json({ error: "No subscription ID provided." });
        }

        // Tells Stripe to cancel the subscription at the end of the current billing cycle
        const canceledSubscription = await stripe.subscriptions.update(
            subscriptionId,
            { cancel_at_period_end: true }
        );

        res.json({ success: true, subscription: canceledSubscription });
    } catch (err) {
        console.error("Cancellation Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/update-address', async (req, res) => {
    try {
        const { userID, addressData } = req.body;
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
                stripe: {
                    billingInfo: {
                        name: addressData.name,
                        address: addressData.address,
                        updatedAt: new Date()
                    },
                }
            })
            .eq('id', userID);
        if (error) {
            console.log('Error updating address: ', error);
            res.status(400).json({ error: error.message });
        }
        res.json({ success: true, message: "Address saved to Supabase." });
    } catch (err) {
        console.error(err);
        res.sendStatus(500).json({ error: err.message });
    }

});

// Start the server
app.listen(PORT, () => {
    console.log(`Node server listening on port ${PORT}`);
});