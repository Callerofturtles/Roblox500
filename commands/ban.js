const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { run } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban').setDescription('Ban a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason'))
    .addIntegerOption(o => o.setName('days').setDescription('Delete message days (0-7)').setMinValue(0).setMaxValue(7)),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const days = interaction.options.getInteger('days') || 0;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member?.bannable) return interaction.reply({ content: '❌ Cannot ban this user.', ephemeral: true });
    await member.ban({ deleteMessageSeconds: days * 86400, reason: `${interaction.user.tag}: ${reason}` });
    run('INSERT INTO moderation (user_id, guild_id, mod_id, action, reason) VALUES (?,?,?,?,?)', [target.id, interaction.guild.id, interaction.user.id, 'ban', reason]);
    const embed = new EmbedBuilder().setColor(config.colors.danger).setTitle('🔨 Member Banned')
      .addFields({ name: 'User', value: `${target.tag} (${target.id})`, inline: true }, { name: 'Moderator', value: interaction.user.tag, inline: true }, { name: 'Reason', value: reason })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
