require('dotenv').config(); // 環境変数を読み込む
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const roleManager = require('../discord/roleManager.js'); // roleManagerのインポート

module.exports = {
    execute: async function(interaction) {
        const discordUserId = interaction.user.id;
        const hasInputRole = await roleManager.hasRole(discordUserId, 'インプット');
        const hasOutputRole = await roleManager.hasRole(discordUserId, 'アウトプット');

        let options = [];
        if (hasInputRole) {
            options.push({
                label: 'アップグレード',
                description: 'アウトプットプランにアップグレードします',
                value: process.env.OUTPUT_PLAN_PRICE_ID,
            });
            options.push({
                label: '解約',
                description: 'サブスクリプションを解約します',
                value: 'cancel',
            });
        } else if (hasOutputRole) {
            options.push({
                label: 'ダウングレード',
                description: 'インプットプランにダウングレードします',
                value: process.env.INPUT_PLAN_PRICE_ID,
            });
        } else {
            // 両方のロールがない場合の選択肢
            options.push({
                label: 'インプットプラン',
                description: 'インプット専門のプランです',
                value: process.env.INPUT_PLAN_PRICE_ID,
            });
            options.push({
                label: 'アウトプットプラン',
                description: 'アウトプット専用のプランです',
                value: process.env.OUTPUT_PLAN_PRICE_ID,
            });
        }

        const selectMenuRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_plan')
                    .setPlaceholder('プランを選択してください')
                    .addOptions(options),
            );

        await interaction.reply({ content: 'プランを選択してください。', components: [selectMenuRow], ephemeral: true });
    }
};