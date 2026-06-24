const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { run } = require('../../database/db');
const { parseTime, formatTime } = require('../../utils/helpers');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute').setDescription('Timeout a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to mute').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 10m, 1h, 1d)').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const duration = parseTime(durationStr);
    if (!duration) return interaction.reply({ content: '❌ Invalid duration. Examples: `10m`, `1h`, `2d`', ephemeral: true });
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
    await member.timeout(duration, `${interaction.user.tag}: ${reason}`);
    run('INSERT INTO moderation (user_id, guild_id, mod_id, action, reason, duration) VALUES (?,?,?,?,?,?)', [target.id, interaction.guild.id, interaction.user.id, 'mute', reason, duration]);
    const embed = new EmbedBuilder().setColor(config.colors.warning).setTitle('🔇 Member Muted')
      .addFields({ name: 'User', value: target.tag, inline: true }, { name: 'Duration', value: formatTime(duration), inline: true }, { name: 'Reason', value: reason })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
