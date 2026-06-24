const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { run, lastInsertId } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest').setDescription('Submit a server suggestion')
    .addStringOption(o => o.setName('suggestion').setDescription('Your suggestion').setRequired(true)),
  async execute(interaction) {
    const content = interaction.options.getString('suggestion');
    const embed = new EmbedBuilder().setColor(config.colors.accent).setTitle('💡 New Suggestion')
      .setDescription(content)
      .addFields({ name: '👤 Submitted by', value: `<@${interaction.user.id}>` }, { name: '📊 Votes', value: '👍 0 | 👎 0' })
      .setTimestamp();
    const tempRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('suggest_up_0').setLabel('👍 Upvote').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('suggest_down_0').setLabel('👎 Downvote').setStyle(ButtonStyle.Danger),
    );
    const msg = await interaction.reply({ embeds: [embed], components: [tempRow], fetchReply: true });
    run('INSERT INTO suggestions (user_id, content, message_id) VALUES (?,?,?)', [interaction.user.id, content, msg.id]);
    const id = lastInsertId();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`suggest_up_${id}`).setLabel('👍 Upvote').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`suggest_down_${id}`).setLabel('👎 Downvote').setStyle(ButtonStyle.Danger),
    );
    await msg.edit({ components: [row] });
  },
};
