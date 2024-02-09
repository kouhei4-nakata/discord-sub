const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('../database/dbClient'); // Prismaクライアントのインポート

async function createCheckoutSession(discordUserId, planId) {
  let roleName;
  if (planId === process.env.INPUT_PLAN_PRICE_ID) {
    roleName = 'インプット';
  } else if (planId === process.env.OUTPUT_PLAN_PRICE_ID) {
    roleName = 'アウトプット';
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: planId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      metadata: {
        discordUserId: discordUserId,
        roleName: roleName,
      },
    });

    // データベースにサブスクリプション情報を保存
    await prisma.subscription.create({
      data: {
        discordUserId: discordUserId,
        roleName: roleName,
        subscriptionId: session.id,
      },
    });

    return session.url;
  } catch (error) {
    console.error(`Checkout session creation failed for user '${discordUserId}' with plan '${planId}':`, error);
    throw error;
  }
}

module.exports = { createCheckoutSession };