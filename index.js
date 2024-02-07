require('dotenv').config();
//console.log(process.env)
//console.log("STRIPE_WEBHOOK_SECRET:", process.env.STRIPE_WEBHOOK_SECRET);
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const paymentCommand = require('./commands/paymentCommand.js');
const { createCheckoutSession } = require('./stripe/stripeClient.js');
const express = require('express');
const app = express();
const setupWebhookHandler = require('./stripe/webhookHandler.js');

// Discordクライアントの設定
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // メッセージ内容へのアクセスを要求するインテント
    // 必要に応じて他のインテントを追加
  ]
});

client.once('ready', () => {
  console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
    try {
      if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu()) return;
  
      if (interaction.commandName === 'payment') {
        await paymentCommand.execute(interaction);
      } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_plan') {
          const discordUserId = interaction.user.id;
          const selectedPlanId = interaction.values[0];
          const checkoutUrl = await createCheckoutSession(discordUserId, selectedPlanId);
          
          const button = new ButtonBuilder()
            .setLabel('支払いへ進む')
            .setStyle(ButtonStyle.Link)
            .setURL(checkoutUrl);
  
          const row = new ActionRowBuilder().addComponents(button);
  
          await interaction.update({ content: '支払いページに進むには下のボタンをクリックしてください。', components: [row] });
        }
      }
    } catch (error) {
      console.error('エラーが発生しました:', error);
      await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);


// Webhookハンドラーの設定
setupWebhookHandler(app);

// Expressアプリケーションの設定
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server is running on port ${PORT}`);
});