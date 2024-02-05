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

    // 支払いが成功した場合の処理
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const discordUserId = session.metadata.discordUserId; // DiscordユーザーIDをメタデータから取得
        const purchasedPriceId = session.metadata.priceId; // 購入された価格IDをメタデータから取得

        // 購入された価格IDに基づいてロールを割り当てる
        let roleName;
        if (purchasedPriceId === process.env.INPUT_PLAN_PRICE_ID) {
            roleName = 'インプット';
        } else if (purchasedPriceId === process.env.OUTPUT_PLAN_PRICE_ID) {
            roleName = 'アウトプット';
        }

        if (roleName) {
            await roleManager.assignRole(discordUserId, roleName);
        }
    }

    res.json({received: true});
});

app.listen(3000, () => console.log('Running on port 3000'));