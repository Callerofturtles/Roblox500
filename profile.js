const { SlashCommandBuilder } = require('discord.js');
const { getUser, get } = require('../../database/db');
const { profile: profileEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View a developer profile')
    .addUserOption(o => o.setName('user').setDescription('User to view')),
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const dbUser = getUser(target.id);
    const dbProfile = get('SELECT * FROM profiles WHERE user_id = ?', [target.id]) || {};
    await interaction.reply({ embeds: [profileEmbed(target, dbUser, dbProfile)] });
  },
};
