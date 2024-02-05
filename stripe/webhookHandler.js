const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const roleManager = require('../discord/roleManager.js');

const app = express();
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    switch (event.type) {
        case 'checkout.session.completed':
            // 支払いが成功し、セッションが完了した場合の処理
            const session = event.data.object;
            const discordUserId = session.metadata.discordUserId;
            const purchasedPriceId = session.metadata.priceId;

            let roleName;
            if (purchasedPriceId === process.env.INPUT_PLAN_PRICE_ID) {
                roleName = 'インプット';
            } else if (purchasedPriceId === process.env.OUTPUT_PLAN_PRICE_ID) {
                roleName = 'アウトプット';
            }

            if (roleName) {
                await roleManager.assignRole(discordUserId, roleName);
            }
            break;

        case 'customer.subscription.deleted':
        case 'customer.subscription.updated':
            // サブスクリプションが削除された場合、または更新された場合の処理
            const subscription = event.data.object;
            const userId = subscription.metadata.discordUserId;

            // サブスクリプションのステータスに応じてロールを剥奪する処理を実装
            if (event.type === 'customer.subscription.deleted' || (event.type === 'customer.subscription.updated' && subscription.status !== 'active')) {
                await roleManager.removeRole(userId);
            }
            break;

        // 他のイベントタイプに対する処理...
    }

    res.json({received: true});
});

app.listen(3000, () => console.log('Running on port 3000'));