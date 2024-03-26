require('dotenv').config(); // 環境変数を読み込む
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const roleManager = require('../discord/roleManager.js'); // roleManagerのインポート

module.exports = {
    execute: async function(interaction) {
        // ユーザーにローディング状態を示す
        await interaction.deferReply({ ephemeral: true });

        const discordUserId = interaction.user.id;
        // ロールの確認を行う
        const hasInputRole = await roleManager.hasRole(discordUserId, 'インプット');
        const hasOutputRole = await roleManager.hasRole(discordUserId, 'アウトプット');

        let options = [];
        // ロールに基づいて選択肢を設定
        if (hasInputRole) {
            options.push({
                label: 'アップグレード',
                description: 'アウトプットプランにアップグレードします',
                value: process.env.OUTPUT_PLAN_PRICE_ID,
            });
            options.push({
                label: '解約',
                description: 'サブスクリプションを解約します',
                value: 'サポートにお問い合わせください',
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

        // 選択肢を含むメニューを作成
        const selectMenuRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_plan')
                    .setPlaceholder('プランを選択してください')
                    .addOptions(options),
            );

        // ロールの確認が完了したら、選択肢をユーザーに表示
        await interaction.editReply({ content: 'プランを選択してください。', components: [selectMenuRow], ephemeral: true });
    }
};