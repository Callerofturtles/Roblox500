const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send a formatted announcement to any channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(o => o.setName('channel').setDescription('Channel to send the announcement to').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Announcement message').setRequired(true))
    .addStringOption(o => o.setName('title').setDescription('Embed title (optional)'))
    .addRoleOption(o => o.setName('ping').setDescription('Role to ping (optional)'))
    .addStringOption(o => o.setName('color').setDescription('Embed color').addChoices(
      { name: '🔵 Blue (default)', value: 'blue' },
      { name: '🔴 Red', value: 'red' },
      { name: '🟢 Green', value: 'green' },
      { name: '🟡 Gold', value: 'gold' },
      { name: '🩸 Horror Red', value: 'horror' },
    )),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');
    const title = interaction.options.getString('title') || '📢 Announcement';
    const pingRole = interaction.options.getRole('ping');
    const colorChoice = interaction.options.getString('color') || 'blue';

    const colors = {
      blue: config.colors.accent,
      red: config.colors.danger,
      green: config.colors.success,
      gold: config.colors.gold,
      horror: config.colors.horror,
    };

    const embed = new EmbedBuilder()
      .setColor(colors[colorChoice])
      .setTitle(title)
      .setDescription(message)
      .setFooter({ text: `Announced by ${interaction.user.username} • Roblox Launch Network` })
      .setTimestamp();

    const content = pingRole
      ? (pingRole.id === interaction.guild.roles.everyone.id ? '@everyone' : `<@&${pingRole.id}>`)
      : undefined;

    await channel.send({ content, embeds: [embed] });
    await interaction.reply({ content: `✅ Announcement sent to ${channel}!`, ephemeral: true });
  },
};
