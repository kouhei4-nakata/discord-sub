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
                // metadataの内容をログに出力
                console.log('Received metadata:', subscription.metadata);
            
                const userId = subscription.metadata.discordUserId;
                const roleName = subscription.metadata.roleName;
            
                console.log(`Extracted userId: ${userId}, roleName: ${roleName}`); // 抽出した値をログに出力
            
                // 以下、ロール剥奪の処理...            
                if (userId && roleName) {
                    try {
                        await roleManager.removeRole(userId, roleName);
                    } catch (error) {
                        console.error('Error removing role:', error);
                    }
                } else {
                    console.error('discordUserId or roleName is undefined.');
                }
                break;
        }

        // 応答
        response.status(200).end();
    });
}

module.exports = setupWebhookHandler;