const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder().setName('inviteleaderboard').setDescription('View the invite leaderboard'),
  async execute(interaction) {
    const rows = getLeaderboard('invites', 10);
    const embed = new EmbedBuilder().setColor(config.colors.gold).setTitle('📨 Invite Leaderboard').setTimestamp().setFooter({ text: 'Roblox Launch Network' });
    if (!rows.length) embed.setDescription('No invites tracked yet!');
    else {
      const medals = ['🥇', '🥈', '🥉'];
      embed.setDescription(rows.map((r, i) => `${medals[i] || `**${i+1}.**`} <@${r.inviter_id}> — **${r.invite_count}** invites`).join('\n'));
    }
    await interaction.reply({ embeds: [embed] });
  },
};
