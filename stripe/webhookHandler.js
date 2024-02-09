const express = require('express');
require('dotenv').config({ path: '../.env' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const roleManager = require('../discord/roleManager.js');
const prisma = require('../database/dbClient'); // Prismaクライアントのインポート

function setupWebhookHandler(app) {
    app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
        const sigHeader = request.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;

        try {
            event = stripe.webhooks.constructEvent(request.body, sigHeader, endpointSecret);
        } catch (err) {
            console.error(err);
            response.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        // イベントタイプごとの処理開始をログに記録
        console.log(`Received event: ${event.type}`);
        
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const discordUserId = session.metadata.discordUserId;
                const roleName = session.metadata.roleName;

                // ロールの割り当て
                if (roleName) {
                    try {
                        await roleManager.assignRole(discordUserId, roleName);
                    } catch (error) {
                        console.error('Error assigning role:', error);
                    }
                }
                console.log(`Assigning role '${roleName}' to user '${discordUserId}'`);
                break;
            case 'customer.subscription.deleted':
                const subscriptionId = event.data.object.id;

                // データベースからサブスクリプション情報を検索し、削除
                const subscription = await prisma.subscription.findUnique({
                  where: {
                    subscriptionId: subscriptionId,
                  },
                });

                if (subscription) {
                  const { discordUserId, roleName } = subscription;
                  // ロールの削除
                  try {
                      await roleManager.removeRole(discordUserId, roleName);
                  } catch (error) {
                      console.error('Error removing role:', error);
                  }

                  // データベースからサブスクリプション情報を削除
                  await prisma.subscription.delete({
                    where: {
                      subscriptionId: subscriptionId,
                    },
                  });
                }
                console.log(`Removing role '${roleName}' from user '${discordUserId}' due to subscription deletion`);
                break;
            // 他のイベントタイプに対する処理をここに追加...
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }   
        

        response.status(200).end();
    });
}

module.exports = { setupWebhookHandler };