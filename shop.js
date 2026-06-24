const { SlashCommandBuilder } = require('discord.js');
const { buildShopEmbed } = require('../../systems/economySystem');

module.exports = {
  data: new SlashCommandBuilder().setName('shop').setDescription('View the token shop'),
  async execute(interaction) {
    await interaction.reply({ embeds: [buildShopEmbed()] });
  },
};
