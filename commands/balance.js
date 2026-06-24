const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your token balance')
    .addUserOption(o => o.setName('user').setDescription('User to check')),
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const user = getUser(target.id);
    const embed = new EmbedBuilder()
      .setColor(config.colors.gold)
      .setTitle(`💰 ${target.username}'s Balance`)
      .addFields(
        { name: '🪙 Tokens', value: `**${user.tokens}**`, inline: true },
        { name: '⭐ XP', value: `**${user.xp}**`, inline: true },
        { name: '🏆 Level', value: `**${user.level}**`, inline: true },
      )
      .setThumbnail(target.displayAvatarURL())
      .setTimestamp().setFooter({ text: 'Earn tokens via activity, sessions & events' });
    await interaction.reply({ embeds: [embed] });
  },
};
