const { cancelSubscription } = require('../stripe.js');
const { removeRole } = require('../bot.js'); // Import removeRole function from bot.js

module.exports = {
  name: 'unsubscribe',
  description: 'Unsubscribe a user from a Stripe plan',
  async execute(interaction) {
    const user = interaction.user;

    try {
      // Cancel the subscription in Stripe
      const cancelledSubscription = await cancelSubscription(user);

      await interaction.reply(`You have been successfully unsubscribed! Your cancelled subscription ID is ${cancelledSubscription.id}`);
      
      // Remove role from user
      removeRole(user.id, 'ROLE_ID', 'GUILD_ID'); // Replace 'ROLE_ID' and 'GUILD_ID' with appropriate values
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error while unsubscribing!', ephemeral: true });
    }
  },
};
