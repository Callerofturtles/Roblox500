const { SlashCommandBuilder } = require('discord.js');
const { startVerification } = require('../../systems/verificationSystem');

module.exports = {
  data: new SlashCommandBuilder().setName('verify').setDescription('Verify your Roblox account'),
  async execute(interaction) {
    await startVerification(interaction);
  },
};
