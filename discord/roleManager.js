const discordClient = require('./discordClient.js');

module.exports = {
    assignRole: async function(userId, roleName) {
        const guild = discordClient.guilds.cache.get(process.env.GUILD_ID);
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            console.log(`Role not found: ${roleName}`); // ロールが見つからない場合のログ出力
            return;
        }
        try {
            const member = await guild.members.fetch(userId);
            await member.roles.add(role.id);
        } catch (error) {
            console.error(`Error assigning role: ${error}`); // エラーハンドリングの強化
        }
    },
    removeRole: async function(userId, roleName) {
        console.log(`Trying to remove role '${roleName}' from user '${userId}' in guild '${process.env.GUILD_ID}'`);
        const guild = discordClient.guilds.cache.get(process.env.GUILD_ID);
        if (!guild) {
            console.error(`Guild not found: ${process.env.GUILD_ID}. Make sure the bot is in the guild and the GUILD_ID is correct.`);
            return;
        }
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            console.log(`Role not found: ${roleName}`);
            return;
        }
        try {
            const member = await guild.members.fetch(userId);
            await member.roles.remove(role.id);
        } catch (error) {
            console.error(`Error removing role: ${error}`);
        }
    }
    };
