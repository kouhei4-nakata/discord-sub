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
            console.error(`Error assigning role '${roleName}' to user '${userId}': ${error}`);
        }
    },
    removeRole: async function(userId, roleName) {
        console.log(`Trying to remove role '${roleName}' from user '${userId}' in guild '${process.env.GUILD_ID}'`);
        
        if (!userId || !roleName) {
            console.error(`Invalid arguments: userId=${userId}, roleName=${roleName}`);
            return;
        }
    
        const guild = discordClient.guilds.cache.get(process.env.GUILD_ID);
        if (!guild) {
            console.error(`Guild not found: ${process.env.GUILD_ID}. Make sure the bot is in the guild and the GUILD_ID is correct.`);
            return;
        }
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            console.error(`Role not found: ${roleName}`);
            return;
        }
        try {
            const member = await guild.members.fetch(userId);
            await member.roles.remove(role.id);
        } catch (error) {
            console.error(`Error removing role '${roleName}' from user '${userId}': ${error}`);
        }
    },
    hasRole: async function(userId, roleName) {
        const guild = discordClient.guilds.cache.get(process.env.GUILD_ID);
        try {
            const member = await guild.members.fetch(userId);
            return member.roles.cache.some(role => role.name === roleName);
        } catch (error) {
            console.error(`Error checking role '${roleName}' for user '${userId}': ${error}`);
            return false;
        }
    }
}



