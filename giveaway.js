const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const { run, get, lastInsertId } = require('../../database/db');
const { parseTime, safeJSON } = require('../../utils/helpers');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway').setDescription('Giveaway commands')
    .addSubcommand(s => s.setName('start').setDescription('Start a giveaway')
      .addStringOption(o => o.setName('prize').setDescription('Prize').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 1h, 30m)').setRequired(true))
      .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setMinValue(1).setMaxValue(10)))
    .addSubcommand(s => s.setName('end').setDescription('End a giveaway').addIntegerOption(o => o.setName('id').setDescription('Giveaway ID').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'start') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: '❌ No permission.', ephemeral: true });
      const prize = interaction.options.getString('prize');
      const duration = parseTime(interaction.options.getString('duration'));
      if (!duration) return interaction.reply({ content: '❌ Invalid duration.', ephemeral: true });
      const winners = interaction.options.getInteger('winners') || 1;
      const endTime = Math.floor((Date.now() + duration) / 1000);

      const embed = new EmbedBuilder().setColor(config.colors.gold).setTitle('🎉 GIVEAWAY!')
        .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${endTime}:R>\n\nClick 🎉 to enter!`)
        .setTimestamp(endTime * 1000);

      const tempRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('giveaway_enter_0').setLabel('🎉 Enter').setStyle(ButtonStyle.Primary));
      const msg = await interaction.reply({ embeds: [embed], components: [tempRow], fetchReply: true });
      run('INSERT INTO giveaways (host_id, channel_id, message_id, prize, winners_count, end_time) VALUES (?,?,?,?,?,?)',
        [interaction.user.id, interaction.channelId, msg.id, prize, winners, endTime]);
      const gid = lastInsertId();
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`giveaway_enter_${gid}`).setLabel('🎉 Enter').setStyle(ButtonStyle.Primary));
      await msg.edit({ components: [row] });
      setTimeout(() => endGiveaway(gid, interaction.client), duration);
    } else {
      const gid = interaction.options.getInteger('id');
      await endGiveaway(gid, interaction.client);
      await interaction.reply({ content: '✅ Giveaway ended!', ephemeral: true });
    }
  },
};

async function endGiveaway(gid, client) {
  const g = get('SELECT * FROM giveaways WHERE id = ?', [gid]);
  if (!g || g.ended) return;
  run('UPDATE giveaways SET ended = 1 WHERE id = ?', [gid]);
  const entries = safeJSON(g.entries, []);
  const channel = await client.channels.fetch(g.channel_id).catch(() => null);
  if (!channel) return;
  if (!entries.length) { channel.send(`🎉 Giveaway for **${g.prize}** ended with no entries.`); return; }
  const winners = [];
  const pool = [...entries];
  for (let i = 0; i < Math.min(g.winners_count, pool.length); i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  channel.send(`🎉 Giveaway ended! **${g.prize}** winners: ${winners.map(w => `<@${w}>`).join(', ')}! Congratulations!`);
}
