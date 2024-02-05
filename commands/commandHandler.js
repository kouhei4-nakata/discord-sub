const paymentCommand = require('./paymentCommand.js');

module.exports = {
    handleCommand: function(interaction) {
        if (interaction.commandName === 'payment') {
            paymentCommand.execute(interaction);
        }
    }
};