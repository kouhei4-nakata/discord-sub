const { createCheckoutSession } = require('../stripe.js');

module.exports = {
  name: 'subscribe',
  description: 'Subscribe a user to a Stripe plan',
  async execute(interaction) {
    const user = interaction.user;

    try {
      // Create a new checkout session in Stripe
      const session = await createCheckoutSession(user);

      await interaction.reply(`You have been successfully subscribed! Your session ID is ${session.id}`);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error while subscribing!', ephemeral: true });
    }
  },
};
