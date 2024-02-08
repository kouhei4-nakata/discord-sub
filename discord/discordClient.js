const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // 必要に応じて他のインテントを追加
  ]
});

client.login(process.env.DISCORD_BOT_TOKEN); // この行が重要

module.exports = client;