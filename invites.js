const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getInviteStats } = require('../../systems/inviteSystem');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invites').setDescription('Check invite stats')
    .addUserOption(o => o.setName('user').setDescription('User to check')),
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const stats = getInviteStats(target.id);
    const embed = new EmbedBuilder().setColor(config.colors.accent).setTitle(`📨 ${target.username}'s Invites`)
      .addFields(
        { name: '✅ Active Invites', value: `**${stats.active}**`, inline: true },
        { name: '📊 Total', value: `**${stats.total}**`, inline: true },
        { name: '👋 Left', value: `**${stats.left}**`, inline: true },
      )
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: 'Rewards: 3→Tester | 10→Priority | 25→Event Host' }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
