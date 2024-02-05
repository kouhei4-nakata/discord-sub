const discordClient = require('./discordClient.js');

module.exports = {
    sendMessage: function(userId, message) {
        const user = discordClient.users.cache.get(userId);
        if (user) {
            user.send({ content: message });
        }
    }
};