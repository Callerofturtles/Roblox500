const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { run, get, getUser } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rep')
    .setDescription('Give reputation to a user')
    .addUserOption(o => o.setName('user').setDescription('User to give rep to').setRequired(true))
    .addIntegerOption(o => o.setName('rating').setDescription('Rating 1-5').setMinValue(1).setMaxValue(5).setRequired(true))
    .addStringOption(o => o.setName('comment').setDescription('Optional comment')),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const rating = interaction.options.getInteger('rating');
    const comment = interaction.options.getString('comment') || '';
    if (target.id === interaction.user.id) return interaction.reply({ content: '❌ You cannot give rep to yourself.', ephemeral: true });

    const giver = getUser(interaction.user.id);
    const now = Math.floor(Date.now() / 1000);
    if (now - (giver.last_rep || 0) < 86400) {
      const hours = Math.ceil((86400 - (now - giver.last_rep)) / 3600);
      return interaction.reply({ content: `⏰ You can give rep again in **${hours} hours**.`, ephemeral: true });
    }

    const existing = get('SELECT * FROM reputation WHERE from_id = ? AND to_id = ? AND created_at > ?', [interaction.user.id, target.id, now - 86400]);
    if (existing) return interaction.reply({ content: '❌ Already rated this user recently.', ephemeral: true });

    run('INSERT INTO reputation (from_id, to_id, rating, comment) VALUES (?, ?, ?, ?)', [interaction.user.id, target.id, rating, comment]);
    run('UPDATE users SET last_rep = ? WHERE id = ?', [now, interaction.user.id]);
    run('UPDATE users SET reputation = reputation + ? WHERE id = ?', [rating, target.id]);

    const stars = '⭐'.repeat(rating);
    const embed = new EmbedBuilder().setColor(config.colors.gold).setTitle('⭐ Reputation Given!')
      .setDescription(`<@${interaction.user.id}> gave **${stars}** to <@${target.id}>!${comment ? `\n\n*"${comment}"*` : ''}`)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
