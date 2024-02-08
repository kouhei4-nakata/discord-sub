const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createCheckoutSession(discordUserId, planId) {
  // 環境変数からプランIDに基づいてロール名を決定する
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
        price: planId, // Stripeで設定したサブスクリプションプランのIDを指定
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      metadata: {
        discordUserId: discordUserId, // DiscordユーザーIDをmetadataに追加
        roleName: roleName, // ロール名もメタデータに追加
      },
    });

    return session.url;
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    throw error;
  }
}
module.exports = { createCheckoutSession };