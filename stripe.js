require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const app = express();
const { addRole, removeRole } = require('./bot.js'); // Import addRole and removeRole functions
const config = require('./config.json');

const createSubscription = async (customerId, priceId) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{
      price: priceId,
    }],
  });
};

const cancelSubscription = async (subscriptionId) => {
  return await stripe.subscriptions.del(subscriptionId);
};

const getSubscriptionHistory = async (customerId) => {
  return await stripe.subscriptions.list({
    customer: customerId,
  });
};

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      // ここに商品情報を追加
    ],
    mode: 'payment',
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
  });

  res.json({ id: session.id });
});

app.post('/webhook', (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Determine the role based on the subscription type
    let roleId;
    for (const plan of config.subscriptionPlans) {
      if (session.line_items[0].price.id === plan.priceId) {
        roleId = plan.roleId;
        break;
      }
    }
    // Add role to user
    addRole(session.customer, roleId, config.guildId);
  }

  res.status(200);
});

module.exports = {
  createSubscription,
  cancelSubscription,
  getSubscriptionHistory,
};
