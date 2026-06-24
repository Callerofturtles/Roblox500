const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { run } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setprofile')
    .setDescription('Set up your developer profile')
    .addStringOption(o => o.setName('roblox').setDescription('Your Roblox username'))
    .addStringOption(o => o.setName('bio').setDescription('Short bio (max 200 chars)'))
    .addStringOption(o => o.setName('portfolio').setDescription('Portfolio/website link'))
    .addStringOption(o => o.setName('genre').setDescription('Favorite game genre'))
    .addIntegerOption(o => o.setName('experience').setDescription('Years of experience').setMinValue(0).setMaxValue(20))
    .addStringOption(o => o.setName('specialties').setDescription('Comma-separated: scripting,building,ui-design,sound-design')),
  async execute(interaction) {
    const roblox = interaction.options.getString('roblox');
    const bio = interaction.options.getString('bio')?.slice(0, 200);
    const portfolio = interaction.options.getString('portfolio');
    const genre = interaction.options.getString('genre');
    const exp = interaction.options.getInteger('experience');
    const specialtiesRaw = interaction.options.getString('specialties');
    const specialties = specialtiesRaw ? JSON.stringify(specialtiesRaw.split(',').map(s => s.trim())) : null;

    run(`INSERT OR IGNORE INTO profiles (user_id) VALUES (?)`, [interaction.user.id]);
    if (roblox !== null) run('UPDATE profiles SET roblox_username = ? WHERE user_id = ?', [roblox, interaction.user.id]);
    if (bio !== null) run('UPDATE profiles SET bio = ? WHERE user_id = ?', [bio, interaction.user.id]);
    if (portfolio !== null) run('UPDATE profiles SET portfolio = ? WHERE user_id = ?', [portfolio, interaction.user.id]);
    if (genre !== null) run('UPDATE profiles SET favorite_genre = ? WHERE user_id = ?', [genre, interaction.user.id]);
    if (exp !== null) run('UPDATE profiles SET years_exp = ? WHERE user_id = ?', [exp, interaction.user.id]);
    if (specialties !== null) run('UPDATE profiles SET specialties = ? WHERE user_id = ?', [specialties, interaction.user.id]);
    if (roblox) run('UPDATE users SET roblox_username = ? WHERE id = ?', [roblox, interaction.user.id]);

    const embed = new EmbedBuilder()
      .setColor(config.colors.success).setTitle('✅ Profile Updated!')
      .setDescription('Your developer profile has been saved. View it with `/profile`.').setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
