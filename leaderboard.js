const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard').setDescription('View server leaderboards')
    .addStringOption(o => o.setName('type').setDescription('Leaderboard type').addChoices(
      { name: '⭐ XP', value: 'xp' }, { name: '💰 Tokens', value: 'tokens' }, { name: '📨 Invites', value: 'invites' }
    )),
  async execute(interaction) {
    const type = interaction.options.getString('type') || 'xp';
    const rows = getLeaderboard(type, 10);
    const labels = { xp: '⭐ XP Leaderboard', tokens: '💰 Token Leaderboard', invites: '📨 Invite Leaderboard' };
    const embed = new EmbedBuilder().setColor(config.colors.gold).setTitle(labels[type]).setTimestamp().setFooter({ text: 'Roblox Launch Network' });
    if (!rows.length) embed.setDescription('No data yet. Start chatting!');
    else {
      const medals = ['🥇', '🥈', '🥉'];
      const lines = rows.map((row, i) => {
        const medal = medals[i] || `**${i + 1}.**`;
        const userId = row.id || row.inviter_id;
        const val = type === 'xp' ? `${row.xp} XP (Lvl ${row.level})` : type === 'tokens' ? `${row.tokens} tokens` : `${row.invite_count} invites`;
        return `${medal} <@${userId}> — ${val}`;
      });
      embed.setDescription(lines.join('\n'));
    }
    await interaction.reply({ embeds: [embed] });
  },
};
