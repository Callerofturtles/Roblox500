const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { run, get, getUser, addXP, addTokens } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('Submit feedback for a testing session and earn rewards')
    .addIntegerOption(o => o.setName('session').setDescription('Session ID').setRequired(true))
    .addIntegerOption(o => o.setName('rating').setDescription('Overall rating (1-5)').setMinValue(1).setMaxValue(5).setRequired(true))
    .addStringOption(o => o.setName('bugs').setDescription('Any bugs you found?'))
    .addStringOption(o => o.setName('suggestions').setDescription('Suggestions for the developer'))
    .addStringOption(o => o.setName('highlight').setDescription('Best thing about the game')),

  async execute(interaction) {
    const sessionId = interaction.options.getInteger('session');
    const rating = interaction.options.getInteger('rating');
    const bugs = interaction.options.getString('bugs') || 'None reported';
    const suggestions = interaction.options.getString('suggestions') || 'None';
    const highlight = interaction.options.getString('highlight') || 'None';

    const session = get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
    if (!session) return interaction.reply({ content: '❌ Session not found.', ephemeral: true });

    // Check if they attended (or were a participant)
    const participants = JSON.parse(session.participants || '[]');
    const attended = JSON.parse(session.attended || '[]');
    const wasInvolved = participants.includes(interaction.user.id) || attended.includes(interaction.user.id) || session.status === 'closed';

    // Check for duplicate feedback
    const existing = get(
      'SELECT id FROM reputation WHERE from_id = ? AND session_id = ?',
      [interaction.user.id, sessionId]
    );
    if (existing) return interaction.reply({ content: '❌ You already submitted feedback for this session.', ephemeral: true });

    // Save feedback as a reputation entry linked to the session
    run(
      'INSERT INTO reputation (from_id, to_id, session_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [interaction.user.id, session.host_id, sessionId, rating, `${bugs} | ${suggestions}`]
    );

    // Update host reputation
    run('UPDATE users SET reputation = reputation + ? WHERE id = ?', [rating, session.host_id]);

    // Reward the feedback giver
    const xpReward = config.xp.feedback;
    const tokenReward = config.economy.session * 0.5;
    addXP(interaction.user.id, xpReward);
    addTokens(interaction.user.id, tokenReward);

    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

    // DM the host with the feedback
    const host = await interaction.client.users.fetch(session.host_id).catch(() => null);
    if (host && host.id !== interaction.user.id) {
      const hostEmbed = new EmbedBuilder()
        .setColor(rating >= 4 ? config.colors.success : rating >= 3 ? config.colors.warning : config.colors.danger)
        .setTitle(`📝 New Feedback for Session #${sessionId}`)
        .setDescription(`**${session.game_name}** received feedback!`)
        .addFields(
          { name: '⭐ Rating', value: `${stars} (${rating}/5)`, inline: true },
          { name: '👤 From', value: `<@${interaction.user.id}>`, inline: true },
          { name: '🐛 Bugs Found', value: bugs, inline: false },
          { name: '💡 Suggestions', value: suggestions, inline: false },
          { name: '✨ Highlight', value: highlight, inline: false },
        )
        .setTimestamp();
      host.send({ embeds: [hostEmbed] }).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Feedback Submitted!')
      .setDescription(`Thanks for testing **${session.game_name}**!`)
      .addFields(
        { name: '⭐ Your Rating', value: `${stars}`, inline: true },
        { name: '🎁 Reward', value: `+${xpReward} XP, +${tokenReward} tokens`, inline: true },
      )
      .setFooter({ text: 'Your feedback helps developers improve!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
