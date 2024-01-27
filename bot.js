const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json');
const stripe = require('stripe')(config.stripe.secret_key);

const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.Guilds, Discord.Intents.FLAGS.GuildMessages]
});

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.once('ready', () => {
  console.log('Bot is ready!');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction, stripe);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

// Add role function
async function addRole(userId, roleId, guildId) {
  const guild = client.guilds.cache.get(guildId);
  const member = guild.members.cache.get(userId);
  const role = guild.roles.cache.get(roleId);

  await member.roles.add(role);
}

// Remove role function
async function removeRole(userId, roleId, guildId) {
  const guild = client.guilds.cache.get(guildId);
  const member = guild.members.cache.get(userId);
  const role = guild.roles.cache.get(roleId);

  await member.roles.remove(role);
}

// Create slash command
client.on('ready', async () => {
  const data = {
    name: 'buy',
    description: 'Purchase a product',
    // Add options here
  };

  const command = await client.guilds.cache.get('GUILD_ID').commands.create(data);
});

client.login(config.discord_token);
