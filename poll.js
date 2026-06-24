const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { run, lastInsertId } = require('../../database/db');
const { parseTime } = require('../../utils/helpers');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll').setDescription('Create a poll')
    .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true))
    .addStringOption(o => o.setName('options').setDescription('Options separated by | (max 5)').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 1h, 30m)')),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    const options = interaction.options.getString('options').split('|').map(s => s.trim()).slice(0, 5);
    const durStr = interaction.options.getString('duration');
    const duration = durStr ? parseTime(durStr) : 3600000;
    const endTime = Math.floor((Date.now() + duration) / 1000);
    const numbers = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'];

    const embed = new EmbedBuilder().setColor(config.colors.accent).setTitle(`📊 ${question}`)
      .setDescription(options.map((o, i) => `**${i + 1}.** ${o} — 0 votes`).join('\n'))
      .addFields({ name: '⏰ Ends', value: `<t:${endTime}:R>` }).setTimestamp();

    const tempRow = new ActionRowBuilder().addComponents(
      options.map((o, i) => new ButtonBuilder().setCustomId(`poll_vote_0_${i}`).setLabel(o.slice(0, 80)).setEmoji(numbers[i]).setStyle(ButtonStyle.Primary))
    );
    const msg = await interaction.reply({ embeds: [embed], components: [tempRow], fetchReply: true });
    run('INSERT INTO polls (host_id, question, options, end_time, message_id, channel_id) VALUES (?,?,?,?,?,?)',
      [interaction.user.id, question, JSON.stringify(options), endTime, msg.id, interaction.channelId]);
    const pollId = lastInsertId();
    const row = new ActionRowBuilder().addComponents(
      options.map((o, i) => new ButtonBuilder().setCustomId(`poll_vote_${pollId}_${i}`).setLabel(o.slice(0, 80)).setEmoji(numbers[i]).setStyle(ButtonStyle.Primary))
    );
    await msg.edit({ components: [row] });
  },
};
