const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { run } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick').setDescription('Kick a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member?.kickable) return interaction.reply({ content: '❌ Cannot kick this user.', ephemeral: true });
    await member.kick(`${interaction.user.tag}: ${reason}`);
    run('INSERT INTO moderation (user_id, guild_id, mod_id, action, reason) VALUES (?,?,?,?,?)', [target.id, interaction.guild.id, interaction.user.id, 'kick', reason]);
    const embed = new EmbedBuilder().setColor(config.colors.warning).setTitle('👢 Member Kicked')
      .addFields({ name: 'User', value: target.tag, inline: true }, { name: 'Moderator', value: interaction.user.tag, inline: true }, { name: 'Reason', value: reason })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
