const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { run, get, lastInsertId } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('give').setDescription('Give tokens or XP to a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(o => o.setName('type').setDescription('What to give').setRequired(true).addChoices({ name: '💰 Tokens', value: 'tokens' }, { name: '⭐ XP', value: 'xp' }))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');
    if (type === 'tokens') addTokens(target.id, amount);
    else addXP(target.id, amount);
    const embed = new EmbedBuilder().setColor(config.colors.success).setTitle('✅ Given!')
      .setDescription(`Gave **${amount} ${type}** to <@${target.id}>.`).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
