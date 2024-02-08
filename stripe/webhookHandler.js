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

        let discordUserId; // ここでdiscordUserIdを宣言

        // イベントタイプに応じた処理を行う
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                discordUserId = session.metadata.discordUserId; // 値を割り当て

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
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                // サブスクリプションIDを使用してStripe APIを呼び出し、サブスクリプションの詳細を取得
                const fullSubscription = await stripe.subscriptions.retrieve(subscription.id);
                console.log(`Subscription retrieved: ${fullSubscription.id}`); // サブスクリプションの取得をログに出力
            
                // ここでmetadataからDiscordユーザーIDとロール名を取得
                discordUserId = fullSubscription.metadata.discordUserId; // 値を割り当て
                console.log(`Retrieved discordUserId: ${discordUserId}`); // discordUserIdの取得をログに出力
            
                // metadataからロール名を取得するように変更
                let roleName = fullSubscription.metadata.roleName; // metadataからロール名を取得
                console.log(`Determined roleName: ${roleName}`); // roleNameの決定をログに出力
            
                if (!discordUserId || !roleName) {
                    console.error('Role name or Discord user ID could not be determined.');
                    return;
                }            
            
                if (roleName && discordUserId) {
                    try {
                        // DiscordのユーザーIDを使用してロールを削除
                        await roleManager.removeRole(discordUserId, roleName);
                    } catch (error) {
                        console.error('Error removing role:', error);
                    }
                } else {
                    console.error('Role name or Discord user ID could not be determined.');
                }
                break;                // 他のイベントタイプに対する処理をここに追加...
            }
    
            response.status(200).end();
        });
    }
    
    module.exports = setupWebhookHandler;