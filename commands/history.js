const getSubscriptionHistory = async (customerId) => {
  return await stripe.subscriptions.list({
    customer: customerId,
  });
};

module.exports = {
  createSubscription,
  cancelSubscription,
  getSubscriptionHistory, // Add this line
};
