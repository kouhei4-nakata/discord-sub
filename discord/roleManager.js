const discordClient = require('./discordClient.js');

module.exports = {
    assignRole: async function(userId, roleName) {
        const guild = discordClient.guilds.cache.get(process.env.GUILD_ID);
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) return; // If the role is not found, do nothing
        const member = await guild.members.fetch(userId);
        await member.roles.add(role.id); // The role ID is now dynamically set based on the role name
    },
    removeRole: async function(userId, roleName) {
        const guild = discordClient.guilds.cache.get(process.env.GUILD_ID);
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) return; // If the role is not found, do nothing
        const member = await guild.members.fetch(userId);
        await member.roles.remove(role.id); // The role ID is now dynamically set based on the role name
    }
};