const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createCheckoutSession(discordUserId, planId) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: planId, // ここにはStripeで設定したサブスクリプションプランのIDを指定
        quantity: 1,
      }],
      mode: 'subscription', // ここを 'payment' から 'subscription' に変更
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      metadata: {
        discordUserId: discordUserId, // DiscordユーザーIDをmetadataに追加
      },
    });

    return session.url;
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    throw error;
  }
}
module.exports = { createCheckoutSession };