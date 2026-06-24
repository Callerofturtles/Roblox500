const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { run, get, lastInsertId } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote').setDescription('Promote your Roblox game')
    .addStringOption(o => o.setName('name').setDescription('Game name').setRequired(true))
    .addStringOption(o => o.setName('link').setDescription('Roblox game link').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Game description').setRequired(true))
    .addStringOption(o => o.setName('genre').setDescription('Game genre').addChoices(
      { name: 'Horror', value: 'horror' }, { name: 'Adventure', value: 'adventure' },
      { name: 'Simulator', value: 'simulator' }, { name: 'Roleplay', value: 'roleplay' },
      { name: 'Fighting', value: 'fighting' }, { name: 'Other', value: 'other' }
    )),
  async execute(interaction) {
    const name = interaction.options.getString('name');
    const link = interaction.options.getString('link');
    const desc = interaction.options.getString('description');
    const genre = interaction.options.getString('genre') || 'other';
    if (!link.includes('roblox.com')) return interaction.reply({ content: '❌ Please provide a valid Roblox game link.', ephemeral: true });

    const existing = get('SELECT * FROM games WHERE submitter_id = ? AND created_at > ?', [interaction.user.id, Math.floor(Date.now() / 1000) - 86400]);
    if (existing) return interaction.reply({ content: '❌ You can only promote one game per day.', ephemeral: true });

    const embed = new EmbedBuilder().setColor(config.colors.accent).setTitle(`🎮 ${name}`).setDescription(desc)
      .addFields(
        { name: '🔗 Play Now', value: `[Click Here](${link})`, inline: true },
        { name: '🏷️ Genre', value: genre.charAt(0).toUpperCase() + genre.slice(1), inline: true },
        { name: '👤 Developer', value: `<@${interaction.user.id}>`, inline: true },
      ).setTimestamp().setFooter({ text: 'Vote using the buttons below!' });

    const tempRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('game_vote_up_0').setLabel('👍 Upvote').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('game_vote_down_0').setLabel('👎 Downvote').setStyle(ButtonStyle.Danger),
    );

    const msg = await interaction.reply({ embeds: [embed], components: [tempRow], fetchReply: true });
    run('INSERT INTO games (submitter_id, game_name, roblox_link, description, genre, message_id) VALUES (?,?,?,?,?,?)', [interaction.user.id, name, link, desc, genre, msg.id]);
    const gameId = lastInsertId();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`game_vote_up_${gameId}`).setLabel('👍 Upvote').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`game_vote_down_${gameId}`).setLabel('👎 Downvote').setStyle(ButtonStyle.Danger),
    );
    await msg.edit({ components: [row] });
  },
};
