const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { giveDailyReward, giveWeeklyReward } = require('../../systems/economySystem');
const config = require('../../config');
const { formatTime } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily token reward'),
  async execute(interaction) {
    const result = giveDailyReward(interaction.user.id);
    if (!result.success) {
      return interaction.reply({
        content: `⏰ Daily already claimed! Come back in **${formatTime(result.remaining * 1000)}**.`,
        ephemeral: true,
      });
    }
    const embed = new EmbedBuilder()
      .setColor(config.colors.gold)
      .setTitle('🎁 Daily Reward!')
      .setDescription(`You received **${result.amount} tokens**!\nCome back tomorrow for more.`)
      .setTimestamp().setFooter({ text: 'Use /weekly for even bigger rewards!' });
    await interaction.reply({ embeds: [embed] });
  },
};
