require('dotenv').config(); // 環境変数を読み込む
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createCheckoutSession } = require('../stripe/stripeClient.js'); // 必要に応じてパスを調整

module.exports = {
    execute: async function(interaction) {
        // 選択メニューの作成
        const selectMenuRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_plan')
                    .setPlaceholder('プランを選択してください')
                    .addOptions([
                        {
                            label: 'インプットプラン',
                            description: 'インプット専門のプランです',
                            value: process.env.INPUT_PLAN_PRICE_ID, // 環境変数から価格IDを読み込む
                        },
                        {
                            label: 'アウトプットプラン',
                            description: 'アウトプット専用のプランです',
                            value: process.env.OUTPUT_PLAN_PRICE_ID, // 環境変数から価格IDを読み込む
                        },
                    ]),
            );

        await interaction.reply({ content: 'プランを選択してください。', components: [selectMenuRow], ephemeral: true });    }
};