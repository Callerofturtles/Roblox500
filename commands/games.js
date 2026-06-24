const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { all } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('games').setDescription('Browse promoted games')
    .addStringOption(o => o.setName('genre').setDescription('Filter by genre').addChoices(
      { name: 'Horror', value: 'horror' }, { name: 'Adventure', value: 'adventure' },
      { name: 'All', value: 'all' }
    )),
  async execute(interaction) {
    const genre = interaction.options.getString('genre') || 'all';
    const games = genre === 'all'
      ? all('SELECT * FROM games ORDER BY votes_up DESC LIMIT 10', [])
      : all('SELECT * FROM games WHERE genre = ? ORDER BY votes_up DESC LIMIT 10', [genre]);
    if (!games.length) return interaction.reply({ content: '📭 No games promoted yet! Use `/promote` to add yours.', ephemeral: true });
    const embed = new EmbedBuilder().setColor(config.colors.accent)
      .setTitle(`🎮 ${genre === 'all' ? 'Top Games' : genre.charAt(0).toUpperCase() + genre.slice(1) + ' Games'}`)
      .setTimestamp().setFooter({ text: 'Use /promote to submit your game!' });
    for (const g of games) embed.addFields({ name: `${g.game_name} (${g.votes_up}👍)`, value: `[Play Now](${g.roblox_link}) • by <@${g.submitter_id}>\n${g.description.slice(0, 80)}...` });
    await interaction.reply({ embeds: [embed] });
  },
};
