require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const paymentCommand = require('./commands/paymentCommand.js');
const { createCheckoutSession } = require('./stripe/stripeClient.js'); // stripeClient.jsから関数をインポート
const express = require('express');
const app = express();

// Discordクライアントの設定
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
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
          // DiscordユーザーIDを取得
          const discordUserId = interaction.user.id;
          const selectedPlanId = interaction.values[0];
          const checkoutUrl = await createCheckoutSession(discordUserId, selectedPlanId);
          
          // 支払いページへのリンクが紐づけられたボタンを作成
          const button = new ButtonBuilder()
            .setLabel('支払いへ進む') // ボタンのラベル
            .setStyle(ButtonStyle.Link) // リンクタイプのボタンを指定
            .setURL(checkoutUrl); // StripeのチェックアウトセッションURLを設定
  
          // ボタンを含むアクションロウを作成
          const row = new ActionRowBuilder().addComponents(button);
  
          // ボタンを含むメッセージをユーザーに送信
          await interaction.update({ content: '支払いページに進むには下のボタンをクリックしてください。', components: [row] });
        }
      }
    } catch (error) {
      console.error('エラーが発生しました:', error);
      await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);

// Expressアプリケーションの設定
app.use(express.json()); // JSONボディのパースに必要

// ここに他のExpressルートハンドラを追加することができます
// 例: app.post('/webhook', webhookHandler);

// Railwayから提供されるPORT環境変数を使用してサーバーを起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server is running on port ${PORT}`);
});