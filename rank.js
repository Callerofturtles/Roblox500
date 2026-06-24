const { SlashCommandBuilder } = require('discord.js');
const { getUser } = require('../../database/db');
const { getProgress } = require('../../utils/levels');
const { rankCard } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your rank and XP progress')
    .addUserOption(o => o.setName('user').setDescription('User to check')),
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const dbUser = getUser(target.id);
    const { level, xpIntoLevel, xpNeeded, percent } = getProgress(dbUser);
    const embed = rankCard(target, { ...dbUser, level }, xpNeeded, percent);
    await interaction.reply({ embeds: [embed] });
  },
};
