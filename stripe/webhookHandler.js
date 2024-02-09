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
                const subscriptionId = session.subscription; // サブスクリプションIDを取得

                // データベースにサブスクリプション情報を保存
                try {
                    await prisma.subscription.create({
                        data: {
                            discordUserId: discordUserId,
                            roleName: roleName,
                            subscriptionId: subscriptionId,
                        },
                    });
                    await roleManager.assignRole(discordUserId, roleName);
                    console.log(`Assigned role '${roleName}' to user '${discordUserId}'`);
                } catch (error) {
                    console.error('Error during subscription creation or role assignment:', error);
                }
                break;
            case 'invoice.paid':
                // インボイスが支払われたときの処理
                const invoice = event.data.object;
                const subscriptionIdForInvoice = invoice.subscription;

                // データベースからサブスクリプション情報を検索し、有効期限を更新
                try {
                    const subscription = await prisma.subscription.findUnique({
                        where: { subscriptionId: subscriptionIdForInvoice },
                    });
                    if (subscription) {
                        const newExpirationDate = new Date();
                        newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);
                        await prisma.subscription.update({
                            where: { subscriptionId: subscriptionIdForInvoice },
                            data: { expirationDate: newExpirationDate },
                        });
                        console.log(`Updated expiration date for subscription: ${subscriptionIdForInvoice}`);
                    }
                } catch (error) {
                    console.error('Error updating subscription expiration date:', error);
                }
                break;
            case 'customer.subscription.deleted':
                const subscriptionIdToDelete = event.data.object.id;
            
                // データベースからサブスクリプション情報を検索し、削除
                try {
                    const subscriptionToDelete = await prisma.subscription.findUnique({
                        where: { subscriptionId: subscriptionIdToDelete },
                    });
                    if (subscriptionToDelete) {
                        const { discordUserId, roleName } = subscriptionToDelete;
                        await roleManager.removeRole(discordUserId, roleName);
                        console.log(`Removed role '${roleName}' from user '${discordUserId}' due to subscription deletion`);
                        await prisma.subscription.delete({
                            where: { subscriptionId: subscriptionIdToDelete },
                        });
                    }
                } catch (error) {
                    console.error('Error removing role or deleting subscription:', error);
                }
                break;
            // 他のイベントタイプに対する処理をここに追加...
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }   
        
        response.status(200).end();
    });
}

module.exports = { setupWebhookHandler };