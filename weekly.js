const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { giveWeeklyReward } = require('../../systems/economySystem');
const config = require('../../config');
const { formatTime } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('weekly').setDescription('Claim your weekly token reward'),
  async execute(interaction) {
    const result = giveWeeklyReward(interaction.user.id);
    if (!result.success) {
      return interaction.reply({
        content: `⏰ Weekly already claimed! Come back in **${formatTime(result.remaining * 1000)}**.`,
        ephemeral: true,
      });
    }
    const embed = new EmbedBuilder()
      .setColor(config.colors.gold)
      .setTitle('🎁 Weekly Reward!')
      .setDescription(`You received **${result.amount} tokens**!\nSee you next week.`)
      .setTimestamp().setFooter({ text: 'Roblox Launch Network' });
    await interaction.reply({ embeds: [embed] });
  },
};
