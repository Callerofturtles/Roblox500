const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { buyItem } = require('../../systems/economySystem');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the shop')
    .addStringOption(o => o.setName('item').setDescription('Item ID to buy').setRequired(true)),
  async execute(interaction) {
    const itemId = interaction.options.getString('item');
    const result = buyItem(interaction.user.id, itemId);
    if (!result.success) {
      return interaction.reply({ content: `❌ ${result.reason}. Check ` + '`/shop` for available items.', ephemeral: true });
    }
    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Purchase Successful!')
      .setDescription(`You bought **${result.item.name}** for **${result.item.price} tokens**!`)
      .setTimestamp().setFooter({ text: 'Roblox Launch Network Shop' });
    await interaction.reply({ embeds: [embed] });
  },
};
