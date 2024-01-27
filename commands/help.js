module.exports = {
  name: 'help',
  description: 'List all available commands or info about a specific command',
  async execute(interaction) {
    const { commands } = interaction.client;
    const args = interaction.options.getString('command');

    if (!args) {
      const commandList = commands.map(command => command.name).join(', ');
      return interaction.reply(`Here are all of my available commands: ${commandList}`);
    }

    const name = args.toLowerCase();
    const command = commands.get(name);

    if (!command) {
      return interaction.reply('That\'s not a valid command!');
    }

    let reply = `**Name:** ${command.name}\n**Description:** ${command.description}`;

    interaction.reply(reply);
  },
};
