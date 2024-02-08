const express = require('express');
require('dotenv').config({ path: '../.env' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const roleManager = require('../discord/roleManager.js');

function setupWebhookHandler(app) {
    app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
        console.log(request.headers['stripe-signature']);
        console.log(request.body.toString()); // リクエストボディを文字列としてログに出力

        const sigHeader = request.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // 環境変数からウェブフックシークレットを取得

        let event;

        try {
            // 署名検証
            event = stripe.webhooks.constructEvent(request.body, sigHeader, endpointSecret);
        } catch (err) {
            // 署名検証失敗
            console.error(err);
            response.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        // イベントタイプに応じた処理を行う
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const discordUserId = session.metadata.discordUserId;

                // Stripe APIを使用してline_itemsを取得
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
                if (lineItems.data.length > 0) {
                    const purchasedPriceId = lineItems.data[0].price.id; // プランIDまたは価格IDを取得

                    let roleName;
                    if (purchasedPriceId === process.env.INPUT_PLAN_PRICE_ID) {
                        roleName = 'インプット';
                    } else if (purchasedPriceId === process.env.OUTPUT_PLAN_PRICE_ID) {
                        roleName = 'アウトプット';
                    }

                    // ロール名が設定されている場合、Discordのユーザーにロールを割り当てる
                    if (roleName) {
                        try {
                            await roleManager.assignRole(discordUserId, roleName);
                        } catch (error) {
                            console.error('Error assigning role:', error);
                        }
                    }
                }
                break;
             // 他のケース...

             case 'customer.subscription.deleted':
                const subscription = event.data.object;
                // サブスクリプションIDを使用してStripe APIを呼び出し、サブスクリプションの詳細を取得
                const fullSubscription = await stripe.subscriptions.retrieve(subscription.id);
                // fullSubscriptionから価格IDを取得
                const priceId = fullSubscription.items.data[0].price.id;
            
                let roleName;
                if (priceId === process.env.INPUT_PLAN_PRICE_ID) {
                    roleName = 'インプット';
                } else if (priceId === process.env.OUTPUT_PLAN_PRICE_ID) {
                    roleName = 'アウトプット';
                }
            
                if (roleName) {
                    try {
                        // ここでuserIdではなく、subscription.customerを使用してユーザーIDを取得する必要があるかもしれません
                        const userId = subscription.customer; // 顧客IDをユーザーIDとして使用
                        await roleManager.removeRole(userId, roleName);
                    } catch (error) {
                        console.error('Error removing role:', error);
                    }
                } else {
                    console.error('Role name could not be determined from price ID.');
                }
                break;        }

        // 応答
        response.status(200).end();
    });
}

module.exports = setupWebhookHandler;